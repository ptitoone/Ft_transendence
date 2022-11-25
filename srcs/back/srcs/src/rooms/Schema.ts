export const PONG_HEIGHT: number = 480;
export const PONG_WIDTH: number = 640;

const center = {
	x: Math.round(PONG_WIDTH / 2),
	y: Math.round(PONG_HEIGHT / 2),
}

export enum PaddleSide {
	LEFT = 0,
	RIGHT,
}

export class Ball {
	public static readonly radius = 10;

	public x = center.x;
	public y = center.y;

	public center() {
		this.x = center.x;
		this.y = center.y;
	}
};

export class Scoreboard {
	public left = 0;
	public right = 0;
};

export class Paddle {
	public static readonly offset = 50;
	public static readonly width = 10;
	public static readonly height = 100;

	public x: number;
	public y = center.y;
	public canvasHeight: number;

	constructor(side: PaddleSide) {
		const actualOffset = Paddle.width / 2 + Paddle.offset;

		switch (side) {
			case PaddleSide.LEFT:
				this.x = actualOffset;
				break;

			case PaddleSide.RIGHT:
				this.x = PONG_WIDTH - actualOffset;
				break;
		}
	}
};

export class Player {

	public side: 'left' | 'right';
	public username: string;
	public skin: string;
	public map: string;
	public id: number;

	public constructor(id: number, username: string, skin: string, map: string) {
		this.username = username;
		this.skin = skin;
		this.id = id;
		this.map = map
	}
};
