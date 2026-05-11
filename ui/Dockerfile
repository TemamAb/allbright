FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY ui/package.json ./ui/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/db/package.json ./lib/db/

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @allbright/ui build

FROM nginx:stable-alpine
COPY --from=builder /app/ui/dist /usr/share/nginx/html
EXPOSE 80