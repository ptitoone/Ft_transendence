import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import 'dotenv/config';
import UserService from '../user/user.service';
import { User } from '@prisma/client'
import { CreateUserDto } from './auth.dto';

@Injectable()
export default class AuthService
{
	@Inject(UserService)
	public readonly users: UserService;

	@Inject(JwtService)
	public readonly jwt: JwtService;

	getUniqueID(): string { return process.env.API_UID; }
	getSecret(): string { return process.env.API_SECRET; }

	async generateJWT(username: string, id: number): Promise<string>
	{
		const payload = { username: username, sub: id };
		return this.jwt.sign(payload)
	}

	async getUserByLogin42(username: string): Promise<User>
	{
      return await this.users.getUserByLogin42(username)
	}

	async createUser(user: CreateUserDto): Promise<User>
	{
		return await this.users.createUser(user);
	}
}
