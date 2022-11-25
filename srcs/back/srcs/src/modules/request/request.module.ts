import ChannelService from '../channel/channel.service'
import RequestController from './request.controller'
import RequestService from './request.service'
import UserService from '../user/user.service'
import { Module } from '@nestjs/common'

@Module({
	controllers: [RequestController],
	exports: [RequestService],
	providers: [
		ChannelService,
		RequestService,
		UserService,
	],
})
export default class RequestModule {}
