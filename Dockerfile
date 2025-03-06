# syntax=docker/dockerfile:1

FROM node:iron-alpine
WORKDIR /app

COPY . .

RUN npm install -g pnpm
RUN pnpm build

CMD ["pnpm", "start:prod"]