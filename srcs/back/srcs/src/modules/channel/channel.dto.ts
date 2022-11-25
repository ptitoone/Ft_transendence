import { ChannelType } from '@prisma/client';
import { IsNotEmpty } from 'class-validator';

export class CreateChannelDto {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  type: ChannelType;

  password?: string;

  users: { id: number }[];
};