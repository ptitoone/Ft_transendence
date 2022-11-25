#!/bin/sh

if [[ $STAGE == "development" ]]; then
	cd /app/src
	npx prisma migrate dev
	npm run start:debug
else
	cd /app/src
	npx prisma migrate deploy
	npm run start:prod
fi