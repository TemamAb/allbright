FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files for pnpm install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ../
COPY lib/api-client-react/package.json ../lib/api-client-react/
COPY lib/db/package.json ../lib/db/

# Now work in ui folder and install
WORKDIR /app/ui
RUN pnpm install --frozen-lockfile

# Build the UI
COPY . .
RUN pnpm build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/ui/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
