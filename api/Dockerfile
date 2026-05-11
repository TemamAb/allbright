# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Install pnpm globally using npm
RUN npm install -g pnpm@9.15.4

# Install system dependencies required for native Node.js modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json tsconfig.base.json ./
COPY tsconfig*.json ./
COPY api ./api
COPY lib ./lib
COPY scripts ./scripts

# Run install - prioritize frozen lockfile, fallback to full install
RUN pnpm install --frozen-lockfile --prefer-offline

RUN pnpm --filter @allbright/api run build

# Render provides the PORT env var; we expose it for documentation
EXPOSE 10000 

CMD ["sh", "-lc", "pnpm --filter @allbright/db run push && PORT=${PORT:-10000} pnpm --filter @allbright/api run start"]
