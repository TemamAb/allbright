# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

# Copy entire workspace (context is project root, .dockerignore excludes node_modules, etc.)
COPY . .

ARG VITE_API_BASE_URL=http://localhost:10000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV BASE_PATH=/

# Install all workspace dependencies
RUN pnpm install --no-frozen-lockfile

# Build the UI package
RUN pnpm --filter @brightsky/ui run build

FROM nginx:1.27-alpine

COPY ui/nginx.conf /etc/nginx/conf.d/default.conf

# Vite build output: from ui/vite.config.ts outDir is ../dist/public relative to ui/
# So builder stage output is at /app/dist/public
COPY --from=builder /app/dist/public /usr/share/nginx/html

EXPOSE 80
