//import PongGameModule from './modules/game/game.module';
import 'dotenv/config'
import { AppGateway } from './app.gateway';
import { PrismaModule } from './modules/prisma/prisma.module';
import AppService from './app.service';
import AuthModule from './modules/auth/auth.module';
import ChannelModule from './modules/channel/channel.module';
import MessageModule from './modules/message/message.module';
import RequestModule from './modules/request/request.module';
import UserModule from './modules/user/user.module';
import GameModule from './modules/game/game.module';
import { ConfigModule } from '@nestjs/config';
import {
	Controller,
	Inject,
	Module,
} from '@nestjs/common';

@Controller()
class AppController
{
	@Inject(AppService)
	private readonly service: AppService;
}

@Module({
	controllers: [AppController],
	exports: [AppService],
	imports: [
		AuthModule,
		ChannelModule,
		ConfigModule,
		MessageModule,
		PrismaModule,
		RequestModule,
		UserModule,
		GameModule,
	],
	providers: [
		AppService,
		AppGateway
	],
})
export default class AppModule {}
