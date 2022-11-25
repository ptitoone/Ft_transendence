#build node mode
FROM node:lts-alpine as builder

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN mkdir -p /app/node_modules /app/dist && chown -R node:node /app

WORKDIR /app

USER node

COPY --chown=node:node ./srcs/package*.json ./
COPY --chown=node:node ./srcs/src/prisma ./src/prisma

#RUN npm ci
RUN npm install

WORKDIR /app/src
RUN npx prisma generate

WORKDIR /app
COPY --chown=node:node ./srcs/ ./

RUN npm run build && npm prune --production

FROM node:lts-alpine as production

WORKDIR /app

USER node

COPY --from=builder /app/package*.json ./

COPY --from=builder /app/dist ./dist

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /entrypoint.sh /entrypoint.sh


CMD ["sh" , "/entrypoint.sh"]
