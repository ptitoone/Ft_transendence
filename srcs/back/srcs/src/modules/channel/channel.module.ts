import ChannelController from './channel.controller';
import ChannelService from './channel.service';
import MessageService from '../message/message.service';
import RequestService from '../request/request.service';
import UserService from '../user/user.service';

import { Module } from '@nestjs/common';

@Module({
	controllers: [ChannelController],
	exports: [ChannelService],
	providers: [
		ChannelService,
		MessageService,
		RequestService,
		UserService,
	],
})
export default class ChannelModule {}
