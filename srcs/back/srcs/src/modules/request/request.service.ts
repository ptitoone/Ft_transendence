import { PrismaService } from '../prisma/prisma.service'
import { Injectable, Inject } from '@nestjs/common'
import { Request, RequestType } from '@prisma/client'

@Injectable()
export default class RequestService {

	constructor(
		@Inject(PrismaService)
		private prisma: PrismaService,
	) { }


  async createRequest({type,  receiverId, senderId, chanBanId, chanMuteId }: { type: RequestType,  receiverId: number, senderId?: number, chanBanId?: number, chanMuteId?: number}): Promise<any> {

	if (type == 'FRIEND') {
		const friendRequestSearch = await this.prisma.request.findFirst({
			where: {
				OR:[
					{
						senderId,
						receiverId,
						type,
					},
					{
						senderId: receiverId,
						receiverId: senderId,
						type,
					},
				],
			},
		});
		if (friendRequestSearch)
			return { error: 'Request was already sent by you or the sender' };
	}

    const request = await this.prisma.request.create({
      data: {
        type,
        senderId,
        receiverId,
		    chanBanId,
		    chanMuteId,
      },
    });
    if (!request)
      return { error: 'Servor error' }
    return { id: request.id }
  }

  async getRequests(receiverId: number): Promise<any> {
    const invit = await this.prisma.request.findMany({
      where: {
        receiverId,
        AND: [
          { type: { not: 'MUTE', }, },
          { type: { not: 'BAN', }, },
        ],
      },
      select: {
        id: true,
        type: true,
        sender: {
          select: {
            avatar: true,
            username: true,
            id: true,
          },
        },
      },
    });
    return invit;
  }

  async getSenderIdGameReq(id: number): Promise<any> {
    const invit = await this.prisma.request.findMany({
      where: {
        id,
        type: 'GAME',
      },
      select: {
        senderId: true,
      },
    });
    return invit;
  }

  async getRequestById(id: number, userID: number): Promise<any> {
      return await this.prisma.request.findFirstOrThrow({
        where: {
          id,
          OR: [
            { senderId: userID, },
            { receiverId: userID, },
          ],
        },
      });
  }

  async deleteRequest(id: number, receiverId?: number): Promise<any> {
    if (receiverId) {
        await this.prisma.request.deleteMany({
        where: {
          id,
          OR: [
            { receiverId, },
            { senderId: receiverId, },
          ],
        },
      });
    }
    else {
        await this.prisma.request.deleteMany({
        where: {
          id,
        },
      });
    }
  }

  async checkExpiration(id: number): Promise<boolean> {
	const timestamp: Date = (await this.prisma.request.findUnique({
		where: { id, },
		select: { created_at: true },
	})).created_at;
	return ( ((new Date().getTime() - timestamp.getTime()) / 60000) > 5 );
  }
}
