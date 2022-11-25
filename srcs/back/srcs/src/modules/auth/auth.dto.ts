export class CreateUserDto {
	username: string;
	login42:string;
	//avatar_id: number;
	avatar: string;
	secret2FA: string;
};

export class FADto {
	secret: string;
	status: string;
};