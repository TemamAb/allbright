FROM node:22-bookworm-slim

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN npm install -g pnpm@9.15.4

WORKDIR /app

# Build context is project root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json tsconfig.base.json ./
COPY ui ./ui
COPY lib ./lib

# Vite requires VITE_ prefixed variables at build time
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm install --frozen-lockfile --prefer-offline
RUN pnpm --filter @allbright/ui build

EXPOSE 4173
CMD ["pnpm", "--filter", "@allbright/ui", "run", "preview", "--host", "0.0.0.0"]
