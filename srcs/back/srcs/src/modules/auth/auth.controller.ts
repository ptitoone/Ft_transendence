import { Body, Controller, Get, Res, Header, Inject, Param, Post, Req, StreamableFile, UseGuards } from '@nestjs/common'
import { getBase64FromURI, getUserAccessToken, getUserInformations } from './auth.utils'
import { generateQrCode, generateSecret, validateCode } from './auth.twofactor'
import { JwtAuthGuard } from './jwt.authguard'
import { CreateUserDto } from './auth.dto'
import AuthService from './auth.service'

@Controller('/api/auth')
export default class AuthController {

	@Inject(AuthService)
	private readonly service: AuthService;

	@Post("/token/:code")
	async login(@Param("code") code: string): Promise<string> {
		let api = await getUserAccessToken(
			this.service.getUniqueID(),
			this.service.getSecret(),
			code,
		);

		if (api.error) return api;

		let infos = await getUserInformations(api.access_token);
		let user = await this.service.users.getUserByLogin42(infos.login);
		if (!user) {
			let image = await getBase64FromURI(infos.image_url);
			if (!image) image = '';
			let req: CreateUserDto = {
				username: infos.login,
				login42: infos.login,
				avatar: image,
				secret2FA: generateSecret(api.access_token),
			}
			user = await this.service.users.createUser(req);
			return JSON.stringify({
				request_token: await this.service.generateJWT(user.username, user.id),
				firstTime: true,
			});
		}
		if (user.status2FA === true)
			return JSON.stringify({ id: user.id });
		return JSON.stringify({
			request_token: await this.service.generateJWT(user.username, user.id),
		});
	}

	@UseGuards(JwtAuthGuard)
	@Get("/twofactor")
	@Header('Content-Type', 'image/png')
	async getQRCode(@Res() res: any, @Req() request): Promise<StreamableFile> {
		let user = await this.service.users.getUser(request.user.id);
		if (!user)
			return res.writeHead(404);
		const image = await generateQrCode(user.username, user.secret2FA);
		const buffer = Buffer.from(image, 'base64');
		res.writeHead(200, { 'Content-Type': 'image/png' });
		res.end(buffer)
		return new StreamableFile(buffer);
	}

	@Post("/twofactor/verif")
	async validate2FA(@Body() body: any): Promise<string> {
		let user = await this.service.users.getUser(parseInt(body.id));
		if (!user || (!body.code || !validateCode(parseInt(body.code), user.secret2FA)))
			return JSON.stringify({error: 'Cannot validate 2fa' });
		return JSON.stringify({ request_token: await this.service.generateJWT(user.username, user.id)});
	}

	@UseGuards(JwtAuthGuard)
	@Post("/twofactor")
	async enable2FA(@Body() body: any, @Req() request): Promise<string> {
		await this.service.users.update2FAStatus(request.user.id, body.status);
		return JSON.stringify({ message: 'Success' });
	}
}
