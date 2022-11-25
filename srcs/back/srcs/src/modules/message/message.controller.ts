import { Controller, Get, Inject, Param, ParseIntPipe, Req, UseGuards } from "@nestjs/common"
import ChannelService from "../channel/channel.service"
import { JwtAuthGuard } from "../auth/jwt.authguard"
import MessageService from './message.service'

@Controller('/api/message')
export default class MessageController {
	@Inject(MessageService)
	private readonly messageService: MessageService;

	@Inject(ChannelService)
	private readonly channelService: ChannelService;

	@UseGuards(JwtAuthGuard)
	@Get("/channel/:id")
	async getChannelMessages(@Param('id', ParseIntPipe) id : number, @Req() request): Promise <any> {
		try {
			await this.channelService.getChannel(id);
		} catch (e) {
			return { error: 'Channel not found' };
		}
			if ((await this.channelService.userIsBanned(id, request.user.id)).res)
				return { error: 'Acces denied, you are banned from this channel' };
		return await this.messageService.getChannelMessages(id, request.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Get("/dm/:id")
	async getDirectMessages(@Param('id', ParseIntPipe) id : number, @Req() request): Promise <any> {
		return await this.messageService.getDirectMessages(request.user.id, id);
	}
}
