import { Channel } from '@prisma/client'
import { CreateChannelDto } from './channel.dto'

function isChannel(toBeDetermined: any): toBeDetermined is Channel {
  if ((toBeDetermined as Channel).owner)
    return true;
  return false;
}

function isCreateChannelDto(toBeDetermined: any): toBeDetermined is CreateChannelDto {
  if (
    (toBeDetermined as CreateChannelDto).name
    && (toBeDetermined as CreateChannelDto).type
    && (toBeDetermined as CreateChannelDto).users
  )
    return true;
  return false;
}

export { isChannel, isCreateChannelDto };
