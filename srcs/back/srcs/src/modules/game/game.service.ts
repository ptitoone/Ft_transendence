import { PrismaService } from '../prisma/prisma.service'
import { Inject, Injectable } from '@nestjs/common'

@Injectable()
export default class GameService {
	constructor(
		@Inject(PrismaService)
		public prisma: PrismaService,
	) {}

	async getGame(id: number): Promise<number> {
		try {
			return (await this.prisma.game.findUniqueOrThrow({
				where: { id },
				select: { id: true, },
			})).id;
		} catch (e) {
			return -1;
		}
	}

	async getGameSpectate(id: number): Promise<number> {
		return (await this.prisma.game.findMany({
			where: {
				OR: [
					{ user1_id: id, },
					{ user2_id: id, },
				],
			},
			select: { id: true, },
			orderBy: {
				created_at: 'desc',
			},
		}))[0].id;
	}
	async create(player1: number, player2: number): Promise<number>
	{
		return (await this.prisma.game.create({
			data:{
				user1_id: player1,
				user2_id: player2,
			}, 
		})).id;
	}

	async updateGame(id: number, winner_id: number, loser_id: number, user1_score: number, user2_score: number): Promise<boolean>
	{
		await this.prisma.game.update({
			where: { id, },
			data: { winner_id, loser_id, user1_score, user2_score },
		});
		return true;
	}
}
