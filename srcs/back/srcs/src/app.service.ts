//import GameService from "./modules/game/game.service";
import AuthService from './modules/auth/auth.service';
import ChannelService from "./modules/channel/channel.service";
import MessageService from "./modules/message/message.service";
import RequestService from "./modules/request/request.service";
import UserService from './modules/user/user.service';
import GameService from "./modules/game/game.service";
import { Inject, Injectable } from "@nestjs/common";

@Injectable()
export class AppService
{
	@Inject(AuthService)
	public readonly auth: AuthService;

	@Inject(ChannelService)
	public readonly channel: ChannelService;

	@Inject(MessageService)
	public readonly messages: MessageService;

	@Inject(RequestService)
	public readonly request: RequestService;

	@Inject(UserService)
	public readonly users: UserService;

	@Inject(GameService)
	public readonly games: GameService;
}
export default AppService
