#builder mode
FROM node:lts-alpine as builder 

RUN mkdir -p /app/node_modules /app/build && chown -R node:node /app

WORKDIR /app

USER node

COPY --chown=node:node ./srcs/package*.json ./

RUN npm ci

COPY --chown=node:node ./srcs/ ./

RUN npm run build

#production mode
FROM nginx:alpine as production

WORKDIR /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/

COPY --from=builder ./app/build/ ./
