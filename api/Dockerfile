FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY api/package.json ./api/
COPY lib/db/package.json ./lib/db/

RUN pnpm install --frozen-lockfile

COPY api/ ./api/
COPY lib/db/ ./lib/db/

RUN pnpm --filter @allbright/api build

EXPOSE 10000
CMD ["node", "api/dist/index.mjs"]
