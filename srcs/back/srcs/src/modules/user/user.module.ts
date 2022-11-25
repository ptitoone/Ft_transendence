//import GameModule from '../game/game.module';
import { PrismaClient } from '@prisma/client'
import RequestService from '../request/request.service';
import UserController from './user.controller';
import UserService from './user.service';

import { Module } from '@nestjs/common';

@Module({
	controllers: [UserController],
	exports: [UserService],
	providers: [
		UserService,
		RequestService
	],
 	imports: [PrismaClient],
})
export default class UserModule {}
