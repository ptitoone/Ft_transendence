//import ChannelService from '../chats/channel.service';
import RequestService from '../request/request.service';
import { CreateUserDto } from '../auth/auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import { User, Request } from '@prisma/client';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export default class UserService {

	constructor(
		@Inject(PrismaService)
		private prisma: PrismaService,

		@Inject(RequestService)
		private requestService: RequestService,
	) { }

	async createUser(user: CreateUserDto): Promise<User> {
		let findUser = await this.prisma.user.findUnique({
			where: {
				username: user.login42
			}
		});
		if (findUser) {
			await this.prisma.user.update({
				where: {
					username: user.login42
				},
				data: {
					username: findUser.login42
				}
			})
		}
		return await this.prisma.user.create({
			data: { ...user },
		});
	}

	async getMe(id: number): Promise<any> {
		return await this.prisma.user.findUnique({
			where: { id, },
			select: {
				id: true,
				username: true,
				avatar: true,
				status: true,
				elo: true,
				status2FA: true,
				blockedInt: {
					select : { id: true },
				},
			},
		});
	}

	async getUser(id: number): Promise<User> {
		return await this.prisma.user.findUnique({
			where: { id, },
		});
	}

	async getUsers(id: number): Promise<any> {
		return await this.prisma.user.findMany({
			where: {
				id: {
					not: id,
				},
			},
			select: {
				id: true,
				username: true,
				avatar: true,
				status: true,
				elo: true,
			},
		});
	}

	async getUserByLogin42(login42: string): Promise<User> {
		return await this.prisma.user.findUnique({
			where: { login42 },
		});
	}

	async getUsername(id: number): Promise<string> {
		const username = await this.prisma.user.findUnique({
			where: { id, },
			select: { username: true, },
		});
		return username.username;
	}

	async getElo(id: number): Promise<number> {
		return (await this.prisma.user.findUnique({
			where: { id },
			select: { elo: true, },
		})).elo;
	}

////// NOT USED YET /////

	async getAvatar(id: number): Promise<string | { error: string }> {
		try {
			const avatar = await this.prisma.user.findUnique({
				where: { id, },
				select: { avatar: true, }
			});
			return avatar.avatar;
		} catch (e) {
			return { error: 'User avatar not found'};
		}
	}

	async getFriends(id: number): Promise<{ id: number, username: string, avatar: string }[]> {
		const friendsInt = await this.prisma.user.findMany({
			where: { id, },
			select: {
				friendInt: {
					select: {
						id: true,
						username: true,
						avatar: true,
						status: true,
					},
				},
			},
		});

		const friendsExt = await this.prisma.user.findMany({
			where: { id, },
			select: {
				friendExt: {
					select: {
						id: true,
						username: true,
						avatar: true,
						status: true,
					},
				},
			},
		});

		const friends = friendsInt[0].friendInt.concat(friendsExt[0].friendExt);

		const uniqueFriends = Array.from(new Set(friends.map(a => a.id))).map(id => {
			return friends.find(a => a.id === id)
		});

		return uniqueFriends;
	}

	async getUserHistory(id: number): Promise < {
		userId: number,
		p2Username: string,
		p2Avatar: string,
		p1Score: string,
		p2Score: string,
		elapsedTime: number,
		win: string,
	}[] > {
		const games = await this.prisma.game.findMany({
			where: {
				OR: [
					{ user1_id: id, },
					{ user2_id: id, },
				],
			},
			orderBy: { created_at: 'desc', }
		});

		const historyList = await Promise.all(games.map(async (e): Promise<any> => {
			let otherId: number = id == e.user1_id ? e.user2_id : e.user1_id;
			let myscore = id == e.user1_id ? e.user1_score : e.user2_score;
			let otherscore = id == e.user2_id ? e.user1_score : e.user2_score;
			let giveup = false

			if ((myscore > otherscore && e.loser_id === id) || (myscore < otherscore && e.loser_id === otherId) || (myscore === otherscore) || (myscore !== 3 && otherscore !==3))
				giveup = true
			return({
				userId: otherId,
				p2Username: await this.getUsername(otherId),
				p2Avatar: await this.getAvatar(otherId),
				p1Score: myscore,
				p2Score: otherscore,
				abandon: giveup,
				win: otherId == e.loser_id ? 'win' : 'loose',
			});
		}));
		return historyList;
	}
	
	async update2FAStatus(id: number, status: boolean): Promise<User> {
		return await this.prisma.user.update({
			where: { id, },
			data: { status2FA: status },
		});
	}

	async updateUsername(id: number, username: string): Promise<User | { error: string } | { message: string }> {

		if (!/^[a-zA-Z][a-zA-Z0-9]{1,14}$/.test(username))
			return { error: "Username must contain between 3 and 14 alphanumeric characters (must start with one letter)" }
		if ((await this.getUser(id)).username === username)
			return { error: "Please enter a different username" }
		if (!username)
			return { error: "You must provide a username" }
		try {
			await this.prisma.user.update({
				where: { id, },
				data: { username: username }
			});
		}
		catch (e) {
			if (e.code === 'P2002')
				return { error: 'Username is already taken' }
			else
				return { error: 'Servor error' }
		}
		return { message: 'Username was successfully updated' }
	}

	async updateElo(id: number, win: boolean): Promise<boolean> {
		const elo = await this.getElo(id);
		let newElo = win ? elo + 10 : elo - 10;

		await this.prisma.user.update({
			where: { id },
			data: { elo: newElo }
		});
		return true;
	}

	async updateStatus(id: number, status: string): Promise<string> {
		await this.prisma.user.update({
			where: { id },
			data: { status: status }
		});
		return status;
	}

	async updateAvatar(id: number, avatar: string): Promise<{ avatar: string }> {
		return await this.prisma.user.update({
			where: { id },
			data: { avatar, },
			select: { avatar: true, },
		});
	}

	async searchUser(username: string, id: number): Promise<{ id: number, username: string }[]> {
		return await this.prisma.user.findMany({
			where: {
				username: {
					startsWith: username,
				},
				id: { not: id, },
			},
			select: {
				id: true,
				username: true,
			},
		});
	}

////////////////// FRIENDS //////////////////
	async addFriend(request: Request, userId: number): Promise<any> {
		try {
			const friend = await this.prisma.user.findUniqueOrThrow({
				where: { id: request.senderId, },
			});
			await this.prisma.user.update({
				where: { id: userId, },
				data: {
					friendInt: {
						connect: { id: friend.id, },
					},
				},
			});
			await this.requestService.deleteRequest(request.id);
		} catch (e) {

		}
	}

	async deleteFriend(id: number, friendId: number): Promise<any> {
		await this.prisma.user.update({
			where: { id, },
			data: {
				friendInt: {
					disconnect: [{ id: friendId }],
				},
				friendExt: {
					disconnect: [{ id: friendId }],
				},
			},
		});
		return true;
	}
/////////////////////////////////////////////

////////////////// BLOCKED //////////////////
	async getBlockeds(userId: number): Promise<number[]> {
		return (await this.prisma.user.findUnique({
			where: { id: userId, },
			select: {
				blockedInt: {
					select: { id: true, }
				},
			},
		})).blockedInt.map( (e) => { return e.id; });
	}

	async addBlocked(userId: number, blockedId: number): Promise<boolean> {
		try {
			await this.prisma.user.update({
				where: { id: userId, },
				data: {
					blockedInt: {
						connect: { id: blockedId, },
					},
				},
			});
			return true;
		} catch (e) {
			return false;
		}
	}

	async deleteBlocked(userId: number, blockedId: number): Promise<boolean> {
		try {
			await this.prisma.user.update({
				where: { id: userId, },
				data: {
					blockedInt: {
						disconnect: [{ id: blockedId }],
					},
					blockedExt: {
						disconnect: [{ id: blockedId }],
					},
				},
			});
			return true;
		} catch (e) {
			return false;
		}
	}

	async userIsBlocked(userId: number, blockedId: number): Promise<{ res: boolean }> {
		try {
			await this.prisma.user.findFirstOrThrow({
				where: {
					id: userId,
					blockedInt: {
						some: { 
							id: blockedId,
						},
					},
				},
			});
			return { res: true };
		} catch (e) {
			return { res: false };
		}
	}
/////////////////////////////////////////////

}
