import { Module } from '@nestjs/common';
import GameService from 'src/modules/game/game.service';
import GameController from './game.controller';

@Module({
	controllers: [GameController],
	providers: [GameService],
	imports: [
	],
	exports: [GameService]
})
export default class GameModule {}
