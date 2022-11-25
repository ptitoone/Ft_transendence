import { PrismaService } from '../prisma/prisma.service';

import { Inject, Injectable, } from '@nestjs/common';

@Injectable()
export default class MessageService {
	constructor(
		@Inject(PrismaService)
		public prisma: PrismaService,
	) { }

	async addMessage(
		{senderId, content , receiverId, chanId }:
		{senderId: number, content: string, receiverId?: number, chanId?: number}
	): Promise<{ res: string } | { error: string }> {
		try {
			await this.prisma.message.create({
				data: {
					senderId,
					receiverId,
					chanId,
					content,
				},
			});
			return { res: 'true' };
		} catch (e) {
			return { error: 'Bad Request' };
		}
	}

	async getChannelMessages(id: number, userId: number): Promise<{ username: string, content: string, }[]> {
		const blockeds = (await this.prisma.user.findUnique({
			where: { id: userId, },
			select: {
				blockedInt: {
					select: { id: true, },
				},
			},
		})).blockedInt.map( (e) => { return e.id });
		const messages = (await this.prisma.message.findMany({
			where: {
				chanId: id,
				senderId: {notIn: blockeds},
			},
			select: {
				user: {
					select: { username: true, },
				},
				content: true,
			},
		})).map( (e) => {
			return({
				username: e.user.username,
				content: e.content,
			});
		});
		return messages;
	}

	async getDirectMessages(senderId: number, receiverId: number): Promise<{ username: string, content: string, }[]> {
		const messages = (await this.prisma.message.findMany({
			where: {
				OR: [
					{
						senderId,
						receiverId,
					},
					{
						senderId: receiverId,
						receiverId: senderId,
					},
				],
			},
			select: {
				user: {
					select: { username: true, }
				},
				content: true,
			},
		})).map( (e) => {
			return({
				username: e.user.username,
				content: e.content,
			});
		});
		return messages;
	}
}
