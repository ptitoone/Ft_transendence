import { SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayInit, MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect } from "@nestjs/websockets"
import { Logger, Inject } from '@nestjs/common'
import { Socket, Server } from 'socket.io'
import GameRoom from './rooms/GameRoom'
import AppService from './app.service'
import { Player } from './rooms/Schema'

@WebSocketGateway(443, {cors: { origin: '*'}})
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {

	@Inject(AppService)
	private readonly service: AppService;

	@WebSocketServer()
	public server: Server;

	private users: Map<number, Socket>;
	private lobby: Map<number, Player>;
	private invitations: Map<number, Player[]>;
	private games: Map<number, GameRoom>;

	private logger: Logger;

	async afterInit() {
		this.lobby = new Map();
		this.users = new Map();
		this.games = new Map();
		this.invitations = new Map();
		this.logger = new Logger('AppGateway');
		setInterval( async() => {
			let mapIter = this.lobby.values();

			if (this.lobby.size < 2)
				return;
			else {
				let player1 = mapIter.next().value;
				let player2 = mapIter.next().value;

				let gameId: number = await this.service.games.create(player1.id, player2.id);
				if (gameId) {
					this.games.set(gameId, new GameRoom(gameId, this.service, this.server, player1, player2));
					this.lobby.delete(player1.id);
					this.lobby.delete(player2.id);
					this.server.to([this.users.get(player1?.id)?.id, this.users.get(player2?.id)?.id]).emit('matched', gameId); //remove player1 player2;
					this.logger.log(`player: ${player1.id} vs player: ${player2.id}`);
				}
				mapIter = this.lobby.values();
			}
		}, 5000);
	}

	async handleConnection(client: Socket) {
		try {
			const verif = this.service.auth.jwt.verify(client.handshake.auth.token, {ignoreExpiration: true});
			console.log(verif)
			const sub  = verif.sub

			this.users.set(sub, client);
			await this.service.users.updateStatus(sub, 'online');

			this.server.sockets.emit('online', sub);
			this.logger.log(`connection, user: ${sub}`);
			this.logger.log(`current users on the map: ${this.users.size}`);
		}
		catch (e) {
			this.logger.log(`token verification failed in handle connection`);
			client.disconnect();
			return ; 
		}
	}

	async handleDisconnect(client: Socket) {
		const { sub } = this.service.auth.jwt.decode(client.handshake.auth.token);
		let user = await this.service.users.getUser(sub);

		if (user && user.status == 'ingame')
		{	
			let player = null;
			let otherId = null;
			for (const [key, value] of this.games) {
				if (sub == value.leftPlayer.id) {
					player = value.leftPlayer;
					otherId = value.rightPlayer.id
				}
				else if(sub == value.rightPlayer.id) {
					player = value.rightPlayer;
					otherId = value.leftPlayer.id
				}
				if (player) {
					await value.onLeave(player);
					this.games.delete(value.id);
					this.service.users.updateStatus(otherId, 'online')
					this.server.emit('online', otherId);
					break;
				}
			}
		} 
		this.users.delete(sub);
		try {
			await this.service.users.updateStatus(sub, 'offline');
		} catch(e) {
			console.log(e);
		}

		this.server.sockets.emit('offline', sub);
		this.logger.log(`deconnection, user: ${sub}`);
		this.logger.log(`current users on the map: ${this.users.size}`);
	}

	@SubscribeMessage('request')
	async handleRequest(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { sub } = this.service.auth.jwt.decode(client.handshake.auth.token);
		const userSocket = this.users.get(data.to);
		this.logger.log(`new request from user: ${sub} to user: ${data.to}`);
		if (userSocket)
			this.server.to(userSocket.id).emit('new_request', data);
	};


	@SubscribeMessage('gamerequest')
	async handleGameRequest(@MessageBody() data: {id: number, accept: string}, @ConnectedSocket() client: Socket) {
		
		const senderId:number | undefined = (await this.service.request.getSenderIdGameReq(data.id))[0]?.senderId;
		
		if (data.accept !== 'Accept')
			this.service.request.deleteRequest(data.id);
		if (senderId) {
			const senderSocketId = this.users.get(senderId)?.id;
			this.server.to(senderSocketId).emit('response_game_request', data)
		}
	};

	@SubscribeMessage('joinroom')
	async handleJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { sub } = this.service.auth.jwt.decode(client.handshake.auth.token);
		const { name, id } = data;

		await this.service.channel.addUser(id, sub);
		this.logger.log(`new join request from user: ${sub} to channel: ${name}`);
		client.join(name);
	};

	@SubscribeMessage('message')
	async handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { sub } = this.service.auth.jwt.decode(client.handshake.auth.token);
		const { id, name, content } = data;
		const username = await this.service.users.getUsername(sub);
		const channelMuted = await this.service.channel.userIsMuted(id, sub);
		const channelBanned = await this.service.channel.userIsBanned(id, sub);
		const userBlocked = await this.service.users.userIsBlocked(id, sub);

		if (!name) {
			let userSocket = this.users.get(id);
			this.logger.log(`message from user: ${sub} to: ${id}`);

			if (userBlocked.res === false) {
				await this.service.messages.addMessage({senderId: sub, receiverId: id, content: content});
				if (userSocket)
					this.server.to(userSocket.id).emit('message', {username: username, content: content, sender: sub, receiver: id});
			}
			this.server.to(client.id).emit('message', {username: username, content: content, sender: sub, receiver: id});
		}
		else if (name && (!channelMuted.res && !channelBanned.res)) {
			this.logger.log(`message from channel: ${id}, by user: ${sub}`);
			await this.service.messages.addMessage({senderId: sub, chanId: id, content: content});
			const banneds = (await this.service.channel.getBanneds(id)).map((el:any) => this.users.get(el.receiverId)?.id);
			this.server.to(name).except(banneds).emit('message', {username: username, content: content, chanId: id, sender:sub});
		}
	};

	/* matchmaking events */
	@SubscribeMessage('queue')
	async handleQueue(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { sub } = this.service.auth.jwt.decode(client.handshake.auth.token);
		const username = await this.service.users.getUsername(sub);
		const { skin, map } = data;

		this.lobby.set(sub, new Player(sub, username, skin, map));
		this.logger.log(`user: ${sub} in lobby queue`);
	};

	@SubscribeMessage('cancel')
	async handleCancel(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { sub } = this.service.auth.jwt.decode(client.handshake.auth.token);

		this.lobby.delete(sub);
		this.logger.log(`user: ${sub} cancel queue`);
	};

	@SubscribeMessage('delete_invitationMap')
	async deleteInvitationMap(@MessageBody() id: number, @ConnectedSocket() client: Socket) {
		if (this.invitations.get(id)) {
			this.invitations.delete(id);
		}
	};

	/* invitation events */
	@SubscribeMessage('queue_invitation')
	async handleQueueInvitation(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { sub } = this.service.auth.jwt.decode(client.handshake.auth.token);
		const username = await this.service.users.getUsername(sub);
		const { skin, map } = data;
		const player: Player = new Player(sub, username, skin, map);
		
		let arr:Player[] = this.invitations.get(data.id);
		if (arr && arr.length === 1)
		{
			arr.push(player);
			this.invitations.set(data.id, arr);
			let gameId: number = await this.service.games.create(arr[0].id, player.id);
			if (gameId) {
				this.games.set(gameId, new GameRoom(gameId, this.service, this.server, arr[0], player));
				this.invitations.delete(data.id);
				this.server.to([this.users.get(arr[0]?.id)?.id, this.users.get(player.id)?.id]).emit('ready', gameId);
			}
		}
		else
		{
			this.invitations.set(data.id, [player]);
		}
	};
	
	/* game events */
	@SubscribeMessage('join')
	async handleJoin(@MessageBody() data : any , @ConnectedSocket() client: Socket) {
		const { sub } = this.service.auth.jwt.decode(client.handshake.auth.token);
		let username: string;
		let game: GameRoom = this.games.get(parseInt(data.id));
		if (game) {
			let player: Player =
				game.leftPlayer.id === sub && !game.lhere ? game.leftPlayer :
				game.rightPlayer.id === sub && !game.rhere ? game.rightPlayer :
				null;
			if (player) {
				username = await this.service.users.getUsername(player.id);
				await game.onJoin(username, player);
			} else {
				await game.onJoin(username);
			}
		}
	};

	@SubscribeMessage('leave')
	async handleLeave(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { sub } = this.service.auth.jwt.decode(client.handshake.auth.token);

		let game =  this.games.get(parseInt(data.id));
		if (game) {
			let player =
				game.leftPlayer.id === sub && game.lhere ? game.leftPlayer :
				game.rightPlayer.id === sub && game.rhere? game.rightPlayer :
				null;
			if (player) {
				await game.onLeave(player);
				this.games.delete(game.id);
			}
		}
	};

	@SubscribeMessage('paddleMove')
	async handleMove(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
		const { sub } = this.service.auth.jwt.decode(client.handshake.auth.token);

		let game = this.games.get(parseInt(data.id));
		if (game) {
			let player =
				game.leftPlayer.id === sub && game.lhere ? game.leftPlayer :
				game.rightPlayer.id === sub && game.rhere ? game.rightPlayer :
				null;
			if (player) {
				await game.onMessage(sub, data.newDirection);
			}
		}
	};
}