import { Get, Inject, Controller, Response, Req, Param, ParseIntPipe, UseGuards, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.authguard';

//import Game from './game.entity';
import { Game } from '@prisma/client';
import GameService from './game.service';

@Controller('/api/games')
export default class GameController {

	@Inject(GameService)
	private readonly gameService: GameService;

	@UseGuards(JwtAuthGuard)
	@Post("/create")
	async createGame(@Body() body: any): Promise <any> {
		const id = await this.gameService.create(body.player1, body.player2);
		return {gameId: id};
	}

	@UseGuards(JwtAuthGuard)
	@Get("/:id")
	async getGame(@Param("id", ParseIntPipe) id: number, @Req() request): Promise<any> {
		const gameid = await this.gameService.getGame(id);
		return ({id: gameid});
	}

	@UseGuards(JwtAuthGuard)
	@Get("/spectate/:id")
	async getGameSpectate(@Param("id", ParseIntPipe) id: number, @Req() request): Promise<any> {
		return await this.gameService.getGameSpectate(id);
	}
}

