import { CreateChannelDto } from './channel.dto';
import { JwtAuthGuard, } from "../auth/jwt.authguard";
import ChannelService from "./channel.service";

import {
	Body,
	Controller,
	Delete,
	Get,
	Inject,
	Param,
	ParseIntPipe,
	Post,
	Req,
	UseGuards,
} from "@nestjs/common";

@Controller("/api/channel")
export default class ChannelController {
	@Inject(ChannelService)
	private readonly channelService: ChannelService;

	@UseGuards(JwtAuthGuard)
	@Get()
	async getChannels(@Req() request): Promise<any> {
		return await this.channelService.getChannels(request.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Post("/create")
	async createChannel(@Body() dto: CreateChannelDto, @Req() request): Promise<any> {
		// CHECK AND SET OWNER TROUGH JWT
		try {
			if (!dto.users.some((e) => e.id === request.user.id))
				dto.users.unshift({ id: request.user.id });
		} catch (e) {
			return { error: 'Bad Request' };
		}

		// REMOVE DUPLICATES
		dto.users = Array.from(new Set(dto.users.map(a => a.id))).map(id => {
			return dto.users.find(a => a.id === id)
		});

		// CHECK NAME
		if (!/[a-zA-Z0-9]{4,14}/.test(dto.name)) {
			return { error: 'Wrong name format, must contain 4 to 14 alphanumeric characters' };
		}

		// CHECK PASSWORD
		if (dto.password.length !== 0 && !/[a-zA-Z0-9]{8,14}/.test(dto.password)) {
			return { error: 'Wrong password format, must contain 8 to 14 alphanumeric characters' };
		}

		// CHECK USERS COUNT
		if (dto.users.length < 2 && dto.type == 'PRIVATE')
			return { error: 'You must provide a minimum of 1 user for a private channel' };
		await this.channelService.createChannel(request.user.id, dto);
		return { success: 'Channel successfully created' }
	}

	@UseGuards(JwtAuthGuard)
	@Get("/:id")
	async getChannel(
		@Param("id", ParseIntPipe) id: number,
		@Req() request
	): Promise<any> {
		try {
			await this.channelService.getChannel(id);
		} catch (e) {
			return { error: 'Channel not found' };
		}
		const admin = await this.channelService.userIsAdmin(id, request.user.id);
		const banned = await this.channelService.userIsBanned(id, request.user.id);
		const isIn = await this.channelService.userIsIn(id, request.user.id);
		const password = await this.channelService.hasPassword(id);
		return ({
			admin: admin.res,
			banned: banned.res,
			isIn: isIn.res,
			password: password.res,
		});
	}

	@UseGuards(JwtAuthGuard)
	@Get('/:id/search')
	async searchUsers(
		@Param('id', ParseIntPipe) id: number,
		@Req() request
	): Promise<any> {
		if ((await this.channelService.userIsIn(id, request.user.id)).res)
			return await this.channelService.searchUsersChannel(id, request.user.id);
		return { error: 'You are not a member of this channel' };
	}

	@UseGuards(JwtAuthGuard)
	@Delete("/:id/leave")
	async leaveChannel(
		@Param("id", ParseIntPipe) id: number,
		@Req() request
	): Promise<any> {
		// CHECK CHANNEL EXISTS
		try {
			await this.channelService.getChannel(id);
		} catch (e) {
			return { error: 'Channel not found' };
		}

		// CHECK IF CHANGE OWNER SHOULD BE CALLED
		if ((await this.channelService.userIsOwner(id, request.user.id)).res)
		{
			const admins = await this.channelService.getAdmins(id);
			const muteds = await this.channelService.getMuteds(id);
			const banneds = await this.channelService.getBanneds(id);
			const users = await this.channelService.getUsers(id);
			let newOwner: number;

			/// CHOOSE NEXT OWNER ///
			if (admins.length > 1) {
				newOwner = (admins.find( (e) => e.id != request.user.id )).id;
			} else if (muteds.length > 0) {
				newOwner = muteds[0].receiverId;
			} else if (banneds.length > 0) {
				newOwner = banneds[0].receiverId;
				await this.channelService.addUser(id, banneds[0].receiverId);
			} else if (users.length > 1) {
				newOwner = (users.find( (e) => e.id != request.user.id )).id;
			} else {
				return await this.channelService.deleteChannel(id);
			}
			await this.channelService.changeOwner(id, request.user.id, newOwner);
			return { res: true };
		}
		return await this.channelService.deleteUser(id, request.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Post("/:id/admin")
	async addAdmin(
		@Param("id", ParseIntPipe) id: number,
		@Body() body: { id: number },
		@Req() request
	): Promise<any> {
		try {
			if ((await this.channelService.userIsOwner(id, request.user.id)).res) {
				if (request.user.id === body.id)
					return { error: 'You are already owner, thus admin' }
				if (!(await this.channelService.addAdmin(id, body.id)).res)
					return { error: 'User is already admin' };
				return { success: 'User is now admin' };
			}
			return { error: 'You don\'t have the right/ to set users as admins'};
		} catch (e) {
			return { error :  'Bad request' };
		}
	}

	@UseGuards(JwtAuthGuard)
	@Post("/:id/ban")
	async addBanned(
		@Body() body: { id: number },
		@Param("id", ParseIntPipe) id: number,
		@Req() request
	): Promise<any> {
		try {
			const authorize = (
				(await this.channelService.userIsOwner(id, request.user.id)).res
				|| (await this.channelService.userIsAdmin(id, request.user.id)).res
			);

			if (authorize) {
				if (request.user.id === body.id)
					return { error: 'You can\'t ban yourself' }
				if ((await this.channelService.userIsOwner(id, body.id)).res)
					return { error: 'You can\'t ban the owner' }
				if (!(await this.channelService.addBanned(id, body.id)).res)
					return { error: 'User is already banned' };
				await this.channelService.deleteUser(id, body.id);
				return { success: 'User has been banned for 5 minutes'};
			}
			return { error: 'You don\'t have the right to ban users'};
		} catch (e) {
			return { error: 'Bad request' };
		}
	}

	@UseGuards(JwtAuthGuard)
	@Post("/:id/mute")
	async addMuted(
		@Body() body: { id: number },
		@Param("id", ParseIntPipe) id: number,
		@Req() request
	): Promise<any> {
		try {
			const authorize = (
				(await this.channelService.userIsOwner(id, request.user.id)).res
				|| (await this.channelService.userIsAdmin(id, request.user.id)).res
			);

			if (authorize) {
				if (request.user.id === body.id)
					return { error: 'You can\'t mute yourself' }
				if ((await this.channelService.userIsOwner(id, body.id)).res)
					return { error: 'You can\'t mute the owner' }
				if (!(await this.channelService.addMuted(id, body.id)).res)
					return { error: 'User is already muted' };
				return { success: 'User has been muted for 5 minutes'};
			}
			return { error: 'You don\'t have the right to mute users'};
		} catch (e) {
			return { error: 'Bad request' };
		}
	}

	@UseGuards(JwtAuthGuard)
	@Delete("/:id/admin/:userId")
	async deleteAdmin(
		@Param("id", ParseIntPipe) id: number,
		@Param("userId", ParseIntPipe) userId: number,
		@Req() request
	): Promise<any> {
		if ((await this.channelService.userIsOwner(id, request.user.id)).res)
			return await this.channelService.deleteUser(id, userId);
	}

//// CHECK FRONT //////
	@UseGuards(JwtAuthGuard)
	@Post("/:id/isBlocked")
	async userIsBlocked(
		@Param("id", ParseIntPipe) id: number,
		@Body() body: { id: number },
		@Req() request
	): Promise<any> {
		return await this.channelService.userIsBanned(id, request.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Post("/:id/isAdmin")
	async userIsAdmin(
		@Param("id", ParseIntPipe) id: number,
		@Body() body: { id: number },
		@Req() request
	): Promise<any> {
		return await this.channelService.userIsAdmin(id, request.user.id);
	}
	
	@UseGuards(JwtAuthGuard)
	@Post("/:id/isMuted")
	async userIsMuted(
		@Param("id", ParseIntPipe) id: number,
		@Body() body: { id: number },
		@Req() request
	): Promise<any> {
		return await this.channelService.userIsMuted(id, request.user.id);
	}
///////////////////////


	@UseGuards(JwtAuthGuard)
	@Post("/:id/auth")
	async verifyChannelPassword(
		@Body() body,
		@Param("id", ParseIntPipe) id: number,
	): Promise<any> {
		if (body.password && !/[a-zA-Z0-9]{8,14}/.test(body.password)) {
			return { error: 'Wrong' };
		}
		return await this.channelService.verifyChannelPassword(id, body.password);
	}

	@UseGuards(JwtAuthGuard)
	@Post("/:id/changePassword")
	async changeChannelPassword(
		@Body() body: any,
		@Param("id", ParseIntPipe) id: number,
		@Req() request
	): Promise <any> {
		if ((await this.channelService.userIsOwner(id, request.user.id)).res) {
			if (body.password && !/[a-zA-Z0-9]{8,14}/.test(body.password)) {
				return { error: 'Wrong password format' };
			}
			return await this.channelService.changeChannelPassword(id, body.password);
		}
	}
}
