import { Inject, Controller, Get, Param, ParseIntPipe, Post, Body, Req, UseGuards } from "@nestjs/common"
import ChannelService from "../channel/channel.service"
import { JwtAuthGuard } from "../auth/jwt.authguard"
import RequestService from "./request.service"
import UserService from "../user/user.service"

@Controller('/api/request')
export default class RequestController {

	@Inject(RequestService)
	private readonly requestService: RequestService;

	@Inject(UserService)
	private readonly userService: UserService;

	@Inject(ChannelService)
	private readonly channelService: ChannelService;

	@UseGuards(JwtAuthGuard)
	@Get()
	async getRequests(@Req() request): Promise<any> {
		return await this.requestService.getRequests(request.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Get()
	async getRequestById(@Param('id', ParseIntPipe) requestId: number, @Req() request): Promise<any> {
		try {
			return await this.requestService.getRequestById(requestId, request.user.id);
		} catch (e) {
			return { error: "Request not found or may not be visible for you" }
		}
	}

	@UseGuards(JwtAuthGuard)
	@Post("/create/friend")
	async createFriendRequest(@Body() body: any, @Req() request): Promise<any> {
		body.id = parseInt(body.id);
		if (!body.id)
			return { error: "Bad request" }
		if (request.user.id == body.id)
			return { error: "You can't invite yourself" };

		let user = (await this.userService.getUser(request.user.id));
		let friend = await this.userService.getUser(body.id);

		if (!(friend))
			return { error: "User doesn't exist" };
		if ((await this.userService.getFriends(user.id)).find((el) => el.username === friend.username))
			return { error: "You are allready friends" };
		return await this.requestService.createRequest({
			type: 'FRIEND',
			senderId: user.id,
			receiverId: body.id
		});
	}

	@UseGuards(JwtAuthGuard)
	@Post("/create/game")
	async createGameRequest(@Body() body: any, @Req() request): Promise<any> {
		body.id = parseInt(body.id);
		if (!body.id)
			return { error: "Bad request" }
		if (request.user.id == body.id)
			return { error: "you can't invite yourself" };

		const user = (await this.userService.getUser(request.user.id));
		const opponent = await this.userService.getUser(body.id);

		if (!(opponent))
			return { error: "User doesn't exist" }
		if ((await this.requestService.getRequests(request.user.id)).find((el: any) => {
			return ( el.senderId == request.user.id && el.receiverId == body.id);
		}))
			return { error: "Game request already sent" }
		return await this.requestService.createRequest({
			type: 'GAME',
			senderId: user.id,
			receiverId: body.id
		});
	}

	@UseGuards(JwtAuthGuard)
	@Post("/create/channelMute")
	async createChannelMuteRequest(@Body() body: any, @Req() request): Promise<any> {
		if (!this.channelService.userIsAdmin(body.channelId, request.user.id))
			return { message: 'error', description: 'You have no admin rights' }
		let user = (await this.userService.getUser(request.user.id));
		let muted = await this.userService.getUser(body.id);

		if (!(muted))
			return { message: 'error', description: "user doesn't exist" }
		if (user.username === muted.username)
			return { message: 'warning', description: "you can't mute yourself" };
		if ((await this.channelService.getMuteds(body.channelId)).find((el) => el.receiverId === muted.id))
			return { message: 'warning', description: "user is are already muted" }
		return await this.requestService.createRequest({
			type: 'MUTE',
			senderId: user.id,
			receiverId: body.id,
		});
	}
}
