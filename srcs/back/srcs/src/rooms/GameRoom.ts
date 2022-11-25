import { Player, Paddle, PaddleSide, Scoreboard, Ball, PONG_HEIGHT } from "./Schema"
import { Logger } from '@nestjs/common'
import AppService from "src/app.service"
import Clock from '@gamestdio/clock'
import { Physics } from './Physics'
import { Server } from 'socket.io'

export default class GameRoom {

	private readonly service: AppService;

	private logger: Logger;

	private server: Server;

	private updater: any;
	private physics: Physics;
	public status: string;
	public id: number;

	public ball: Ball;
	public leftPaddle: Paddle;
	public rightPaddle: Paddle;
	public scoreboard: Scoreboard;

	public leftPlayer: Player;
	public rightPlayer: Player;
	public lhere: boolean = false;
	public rhere: boolean = false;
	private winner: Player;
	private loser: Player;

	constructor(gameId: number, service: AppService, server: Server, p1: Player, p2: Player) {
		this.rightPaddle = new Paddle(PaddleSide.RIGHT);
		this.leftPaddle = new Paddle(PaddleSide.LEFT);
		this.scoreboard = new Scoreboard();
		this.ball = new Ball();
		this.service = service;
		this.logger = new Logger('GameRoom');

		this.physics = new Physics(this.ball, this.leftPaddle, this.rightPaddle);
		this.leftPlayer = p1;
		this.rightPlayer = p2;
		this.server = server;
		this.id = gameId;
		this.status = 'WAITING';
		this.server.emit('status', {id: this.id, status: this.status} );
		this.logger.log(`game room: ${this.id} change status: ${this.status}`);
	}

	public async onMessage(sub: number, newDirection: number) {
		if (sub === this.rightPlayer.id)
			this.physics.setRightPaddleDirection(newDirection);
		if (sub === this.leftPlayer.id)
			this.physics.setLeftPaddleDirection(newDirection);
	};

	public async onJoin(who: string, player?: Player) {
		let clock = new Clock(true);
		if (!player) {
			this.server.emit('status', {id: this.id, status: this.status, leftPlayer: this.leftPlayer, rightPlayer: this.rightPlayer} );
			return;
		}
		if (player) {
			if (this.leftPlayer.id === player.id) {
				player.side = "left";
				this.lhere = true;
				this.server.emit('ingame', player.id);
				this.service.users.updateStatus(player.id, 'ingame');
			}
			if (this.rightPlayer.id == player.id) {
				player.side = "right";
				this.rhere = true;
				this.server.emit('ingame', player.id);
				this.service.users.updateStatus(player.id, 'ingame');
			}
			this.logger.log(`player: ${who}, join ${this.id} game, in ${player.side} side`);
		}
		//	this.logger.log(`watcher: ${who}, watch game room ${this.id}`)
		if (this.lhere && this.rhere) {
			this.status = 'INGAME';
			this.server.emit('status', {id: this.id, status: this.status, leftPlayer: this.leftPlayer, rightPlayer: this.rightPlayer} );
			this.logger.log(`game room: ${this.id} change status: ${this.status}`);
			this.updater = setInterval(() => {
				this.update(clock.deltaTime);
			}, 25);
		}
	};

	public async onLeave(player: Player) {

		if (player === this.leftPlayer)
			this.lhere = false;
		if (player === this.rightPlayer)
			this.rhere = false;
		this.loser = player;
		this.winner = this.leftPlayer === this.loser ? this.rightPlayer : this.leftPlayer;
		this.status = 'INTERRUPTED';
		this.onDispose();
	};

	public async onDispose() {

		clearInterval(this.updater);
		this.status !== 'INTERRUPTED' ? this.status = 'FINISHED' : null;
		if (this.lhere && this.rhere) {
			this.loser = this.scoreboard.left > this.scoreboard.right ? this.rightPlayer : this.leftPlayer;
			this.winner = this.scoreboard.left < this.scoreboard.right ? this.rightPlayer : this.leftPlayer;
		}
		await this.service.users.updateElo(this.winner.id, true);
		await this.service.users.updateElo(this.loser.id, false);
		await this.service.games.updateGame(this.id, this.winner.id, this.loser.id, this.scoreboard.left, this.scoreboard.right);
		this.server.emit('status', {id: this.id, status: this.status} );
		this.logger.log(`game room: ${this.id} change status: ${this.status}`);
		this.server.emit('online', this.rightPlayer.id);
		this.server.emit('online', this.leftPlayer.id);
		this.service.users.updateStatus(this.rightPlayer.id, 'online');
		this.service.users.updateStatus(this.leftPlayer.id, 'online');
		this.lhere = false;
		this.rhere = false;
	};

	private update(deltaTime: number) {

		if (this.status !== 'INGAME')
			return;

		if (this.physics.checkLeftWall()) {
			this.scoreboard.right += 1;
			this.ball.center();
			this.leftPaddle.y = this.rightPaddle.y = PONG_HEIGHT / 2;
			this.physics.setAngle(0);
		}
		if (this.physics.checkRightWall()) {
			this.scoreboard.left += 1;
			this.ball.center();
			this.leftPaddle.y = this.rightPaddle.y = PONG_HEIGHT / 2;
			this.physics.setAngle(Math.PI);
		}

		if (this.scoreboard.left >= 3 || this.scoreboard.right >= 3) {
			this.onDispose();
			return;
		}

		this.physics.update(deltaTime);
		this.server.emit('moveBall', {id: this.id, ball: this.ball} );
		this.server.emit('moveScore', {id: this.id, scoreboard: this.scoreboard} );
		this.server.emit('movePaddle', {id: this.id, left: {x: this.leftPaddle.x, y: this.leftPaddle.y} , right: {x: this.rightPaddle.x, y: this.rightPaddle.y}} );
	};
}