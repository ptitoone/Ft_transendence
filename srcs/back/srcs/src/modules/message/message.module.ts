import { Module } from '@nestjs/common';

import ChannelService from '../channel/channel.service';
import MessageController from './message.controller';
import MessageService from './message.service';
import RequestService from '../request/request.service';
import UserService from '../user/user.service';

@Module({
	providers: [
		ChannelService,
		MessageService,
		RequestService,
		UserService,
	],
	controllers: [MessageController],
	exports: [MessageService]
})
export default class MessageModule {}
