import AppModule from './app.module'
import { NestFactory } from '@nestjs/core'

(async () => {
	const api = await NestFactory.create(AppModule, {
		cors: true
	});
	api.listen(3030);
})();

