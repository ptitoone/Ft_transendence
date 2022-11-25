//import { GameDto } from '../game/game.dto';
//import GameService from '../game/game.service';
import { getBase64FromBuffer } from '../auth/auth.utils';
import { JwtAuthGuard } from '../auth/jwt.authguard';
import RequestService from '../request/request.service';
import UserService from './user.service';

import { FileInterceptor } from '@nestjs/platform-express';
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
	UploadedFile,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';

@Controller('/api/users')
export default class UserController {

	@Inject(UserService)
	private readonly user: UserService;

	@Inject(RequestService)
	private readonly requestService: RequestService;

	@UseGuards(JwtAuthGuard)
	@Get()
	async showUsers(@Req() request): Promise<any> {
		return await this.user.getUsers(request.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Get('/me')
	async showMe(@Req() request): Promise<any> {
		return await this.user.getMe(request.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Post('/status')
	async updateStatus(@Body() data: any, @Req() request): Promise<any> {
		return await this.user.updateStatus(request.user.id, data.status);
	}

	@UseGuards(JwtAuthGuard)
	@Post('/avatar')
	@UseInterceptors(FileInterceptor('file'))
	async updateAvatar(@UploadedFile() file: any, @Req() request): Promise<any> {
		if (!file)
			return { error: "No file was uploaded" };
		let image = await getBase64FromBuffer(file.buffer);
		if (!image)
			return { error: "Error while uploading the file" };
		return await this.user.updateAvatar(request.user.id, image);
	}

	@UseGuards(JwtAuthGuard)
	@Post('/username')
	async updateUsername(
		@Body() data: any,
		@Req() request
	): Promise<any> {
		return await this.user.updateUsername(request.user.id, data.username);
	}

	@UseGuards(JwtAuthGuard)
	@Post('/search')
	async searchUser(@Body() data: { username: string }, @Req() request): Promise<any> {
		return this.user.searchUser(data.username, request.user.id);
	}
	@UseGuards(JwtAuthGuard)
	@Get('/friends')
	async showMyFriends(@Req() request): Promise<any> {
		return await this.user.getFriends(request.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Post('/friends')
	async addFriend(@Body() data: any, @Req() request): Promise<any> {
		try {
			const friendRequest = await this.requestService.getRequestById(data.requestId, request.user.id);
			await this.user.addFriend(friendRequest, request.user.id);
			return { success: "Friend added" }
		} catch (e) {
			return { error: "Bad request" }
		}
	}

	@UseGuards(JwtAuthGuard)
	@Get('/blockeds')
	async getBlockeds(@Req() request): Promise<any> {
		return await this.user.getBlockeds(request.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Post('/block')
	async addBlocked(@Body() body: any, @Req() request): Promise<any> {
		return await this.user.addBlocked(request.user.id, body.id);
	}

	@UseGuards(JwtAuthGuard)
	@Post('/unblock')
	async deleteBlocked(@Body() body: any,@Req() request): Promise<any> {
		return await this.user.deleteBlocked(request.user.id, body.id);
	}

	@UseGuards(JwtAuthGuard)
	@Get('/:id')
	async getMeNo2FA(@Param('id', ParseIntPipe) id: number): Promise<any> {
		let user = await this.user.getMe(id)
		delete user.status2FA;
		return user;
	}

	@UseGuards(JwtAuthGuard)
	@Get('/history/:id')
	async showHistory(@Param('id', ParseIntPipe) id: number): Promise<any> {
		return await this.user.getUserHistory(id);
	}

	@UseGuards(JwtAuthGuard)
	@Get('/friends/:id')
	async showUserFriends(@Param('id', ParseIntPipe) id: number): Promise<any> {
		return await this.user.getFriends(id);
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/friends/:id')
	async deleteFriend(@Param('id', ParseIntPipe) friendId: number, @Req() request): Promise<any> {
		return await this.user.deleteFriend(request.user.id, friendId);
	}

	@UseGuards(JwtAuthGuard)
	@Delete('/request/:id')
	async denyReq(@Req() request, @Param('id', ParseIntPipe) id : number): Promise<any> {
		return await this.requestService.deleteRequest(id, request.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Get('/block/:id')
	async userIsBlocked(@Param('id', ParseIntPipe) id: number, @Req() request): Promise<any> {
		return await this.user.userIsBlocked(request.user.id, id);
	}

}
