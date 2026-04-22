# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json tsconfig.base.json ./
COPY api ./api
COPY lib ./lib
COPY scripts ./scripts

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

EXPOSE 10000

CMD ["sh", "-lc", "pnpm --filter @workspace/db run push && pnpm --filter @workspace/api-server run start"]
