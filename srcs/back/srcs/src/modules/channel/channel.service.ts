import { Channel, Request, User, } from "@prisma/client";
import { CreateChannelDto } from "./channel.dto";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from 'bcrypt';
import RequestService from "../request/request.service";
import UserService from "../user/user.service";

import {
	BadRequestException,
	Inject, 
	Injectable,
	NotFoundException,
} from "@nestjs/common";

@Injectable()
export default class ChannelService {
	constructor(
		@Inject(PrismaService)
		public prisma: PrismaService,

		@Inject(UserService)
		public userService: UserService,

		@Inject(RequestService)
		public requestService: RequestService,

	) { }

	async searchUsersChannel(id: number, userId: number): Promise<{ users: { id: number, username: string }[], owner: boolean }> {
		const users = (await this.prisma.channel.findMany({
			where: { id, },
			select: {
				users: {
					select: {
						id: true,
						username: true,
					},
				},
			},
		}))[0].users.map(e => {
			return({
				id: e.id,
				username: e.username
			});
		});

		return ({
			owner: (await this.userIsOwner(id, userId)).res,
			users: users,
		});
	}

	async getChannel(id: number): Promise<Channel> {
		return await this.prisma.channel.findUniqueOrThrow({ where: { id }, });
	}

	async getChannels(userId: number): Promise<any> {
		let channel = await this.prisma.channel.findMany({
			where: {
				OR: [
					{ type: 'PUBLIC', },
					{
						type: 'PRIVATE',
						users: {
							some: { id: userId, },
						},
					},
				],
			},
			select: {
				id: true,
				name: true,
				password: true,
				owner: true,
				users: {
					select: { username: true },
				},
			},
		});
		if (!channel) return { error: 'No channels found' };
		
		const channelList = await Promise.all(channel.map(async (e): Promise<any> => {
			return({
				id: e.id,
				name: e.name,
				users: e.users,
				ownerAvatar: await this.userService.getAvatar(e.owner),
				protected: e.password ? true : false,
			});
		}));
		return channelList;
	}

	async createChannel(owner: number, dto: CreateChannelDto): Promise<{ success: string } | { error: string }> {

		try {
			if (dto.password)
				dto.password = await bcrypt.hash(dto.password, 10);

			await this.prisma.channel.create({
				data: {
					owner,
					name: dto.name,
					password: dto.password,
					type: dto.type,
					users: {
						connect: dto.users,
					},
					admins: {
						connect: {
							id: owner,
						},
					},
				},
			});
			return { success: 'Channel successfully created' };
		} catch (e) {
			if (e.code === 'P2002')
				return { error: 'Channel name already taken' };
			return { error: 'Bad request' };
		}
	}

	async deleteChannel(id: number): Promise<Channel | { success: string }> {
		await this.prisma.channel.update({
			where: { id, },
			data: {
				muteds: {
					deleteMany: {},
				},
				banneds: {
					deleteMany: {},
				},
			},
		});
		await this.prisma.channel.delete({ where: { id, }, });
		return { success: 'Channel successfully deleted' }
	}

	async hasPassword(id: number): Promise <{ res: boolean }> {
		const password = (await this.prisma.channel.findUnique({
			where: { id, },
			select: { password: true, },
		})).password;
		return password !== "" ? { res: true } : { res: false };
	}

	async deleteMuted(channelId: number, userId: number): Promise<any> {
		try {
			await this.prisma.channel.update({
				where: { id: channelId },
				data: {
					muteds: {
						deleteMany: { receiverId: userId, },
					},
				},
			});
			return { res: true };
		} catch (e) {
			return { res: false };
		}
	}

	async deleteBanned(channelId: number, userId: number): Promise<any> {
		try {
			await this.prisma.channel.update({
				where: { id: channelId },
				data: {
					banneds: {
						deleteMany: { receiverId: userId, },
					},
					users: {
						connect: { id: userId, }
					},
				},
			});
			return { res: true };	
		} catch (e) {
			return { res: false };
		}
	}

	async userIsBanned(channelId: number, userId: number): Promise<{ res: boolean }> {
		try {
			const banneds = (await this.prisma.channel.findUniqueOrThrow({
				where: { id: channelId },
				select: {
					banneds: {
						where: { receiverId: userId, },
						select: { id: true, },
					},
				},
			})).banneds[0];

			if (banneds) {
				if (await this.requestService.checkExpiration(banneds.id))
					return { res : !(await this.deleteBanned(channelId, userId)).res };
				return { res: true };	
			}
			return { res: false };
		} catch (e) {
			return { res: false };
		}
	}

	async userIsMuted(channelId: number, userId: number): Promise<{ res: boolean }> {
		try {
			const muteds = (await this.prisma.channel.findUniqueOrThrow({
				where: { id: channelId, },
				select : {
					muteds: {
						where: { receiverId: userId },
						select: { id: true, },
					},
				},
			})).muteds[0];
			if (muteds) {
				if ((await this.requestService.checkExpiration(muteds.id)))
					return { res : !(await this.deleteMuted(channelId, userId)).res };
				return { res: true };
			}
			return { res: false };
		} catch (e) {
			return { res: false };
		}
	}	

	async userIsOwner(channelId: number, userId: number): Promise<{ res: boolean }> {
		try {
			await this.prisma.channel.findFirstOrThrow({
				where: {
					id: channelId,
					owner: userId,
				},
			});
			return { res: true };
		} catch (e) {
			return { res: false };
		}
	}

	async userIsAdmin(channelId: number, userId: number): Promise<{ res: boolean }> {
		try {
			const channelAdmins = await this.prisma.channel.findFirstOrThrow({
				where: { id: channelId },
				select: {
					admins: {
						where: { id: userId, },
					},
				},
			});
			return channelAdmins.admins.length ? { res: true } : { res: false };
		} catch (e) {
			return { res: false };
		}
	}

	async userIsIn(channelId: number, userId: number): Promise<{ res: boolean }> {
		try {
			const channelUsers = await this.prisma.channel.findFirstOrThrow({
				where: { id: channelId, },
				select : {
					users: {
						where: { id: userId, },
					},
				},
			});
			if (channelUsers.users.length)
				return { res: true };
			return { res: false };
		} catch (e) {
			return { res: false };
		}
	}	

	async getUsers(channelId: number): Promise<User[]> {
		const users = await this.prisma.channel.findUnique({
			where: { id: channelId },
			select: {
				users: true,
			},
		});
		return users != null ? users.users : [];
	}

	async getAdmins(channelId: number): Promise<User[]> {
		const admins = await this.prisma.channel.findUnique({
			where: { id: channelId },
			select: {
				admins: true,
			},
		});
		return admins != null ? admins.admins : [];
	}

	async getMuteds(channelId: number): Promise<Request[]> {
		const muteds = await this.prisma.channel.findUnique({
			where: { id: channelId },
			select: {
				muteds: true,
			},
		});
		return muteds != null ? muteds.muteds : [];
	}

	async getBanneds(channelId: number): Promise<Request[]> {
		const banneds = await this.prisma.channel.findUnique({
			where: { id: channelId },
			select: {
				banneds: true,
			},
		});
		return banneds != null ? banneds.banneds : [];
	}

	async addUser(id: number, userId: number): Promise<any> {
		await this.prisma.channel.update({
			where: { id: id, },
			data: {
				users: {
					connect: { id: userId, },
				},
			},
		});
		return { res: true };
	}

	async addAdmin(channelId: number, userId: number): Promise<any> {
		if ((await this.userIsAdmin(channelId, userId)).res)
			return { res: false };
		await this.prisma.channel.update({
			where: { id: channelId },
			data: {
				admins: {
					connect: { id: userId, },
				},
			},
		});
		return { res: true };
	}

	async addMuted(channelId: number, userId: number): Promise<any> {
		if ((await this.userIsMuted(channelId, userId)).res)
			return { res: false };
		const mute = await this.requestService.createRequest({
			type: 'MUTE',
			receiverId: userId,
			chanMuteId: channelId,
		});
		return { res: true };
	}

	async addBanned(channelId: number, userId: number): Promise<any> {
		if ((await this.userIsBanned(channelId, userId)).res)
			return { res: false };
		const ban = await this.requestService.createRequest({
			type: 'BAN',
			receiverId: userId,
			chanBanId: channelId,
		});
		
		this.prisma.channel.update({
			where: { id: ban.id, },
			data: {
				users: {
					disconnect: { id: userId, },
				},
			},
		});
		return { res: true };
	}

	async deleteUser(channelId: number, userId: number): Promise<any> {
		try {
			await this.prisma.channel.update({
				where: { id: channelId },
				data: {
					users: {
						disconnect: [{ id: userId, }],
					},
					admins: {
						disconnect: [{ id: userId, }],
					},
				},
			});
			return { res: true };
		} catch (e) {
			return { res: false };
		}
	}

	async changeOwner(channelId: number, ownerId: number, newOwnerId: number): Promise<any> {
		try {
			await this.prisma.channel.update({
				where: { id: channelId, },
				data: {
					owner: newOwnerId,
					users: {
						disconnect: [{ id: ownerId, }],
					},
					admins: {
						disconnect: [{ id: ownerId, }],
						connect: { id: newOwnerId, },
					},
					banneds: {
						deleteMany: { receiverId: newOwnerId, },
					},
					muteds: {
						deleteMany: { receiverId: newOwnerId, },
					},
				},
			});
			return { res: true };	
		} catch (e) {
			return { res: false };	
		}
	}

	async verifyChannelPassword(channelId: number, password: string): Promise <{ res : boolean } | { error: string }> {
		try {
			const hashedPassword = await this.prisma.channel.findUniqueOrThrow({
				where: { id: channelId, },
				select: { password: true, },
			});
			return {
				res: (await bcrypt.compare(password, hashedPassword.password)),
			}
		} catch (e) {
			return { error: 'Channel not found' };
		}
	}

	async changeChannelPassword(id: number, password: string): Promise <{ res: boolean } | { error: string }> {
		try {
			password = await bcrypt.hash(password, 10);
			await this.prisma.channel.update({
				where: { id, },
				data: { password, }
			});
			return { res: true };
		} catch (e) {
			return { error: 'Channel not found' };
		}
	}
}
