FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY ui/package.json ./ui/
COPY lib/api-client-react/package.json ./lib/api-client-react/

RUN pnpm install --frozen-lockfile

COPY ui/ ./ui/
COPY lib/api-client-react/ ./lib/api-client-react/
RUN pnpm --filter @allbright/ui build

FROM nginx:stable-alpine
COPY --from=builder /app/ui/dist /usr/share/nginx/html
EXPOSE 80