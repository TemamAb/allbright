FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files for pnpm install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY ui/package.json ./ui/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/db/package.json ./lib/db/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the source code
COPY ui/ ./ui/
COPY lib/ ./lib/

# Build the UI
WORKDIR /app/ui
RUN pnpm build

FROM nginx:stable-alpine
COPY ui/nginx.conf /etc/nginx/conf.d/default.conf
# Reconfigure Nginx at runtime to listen on Render's dynamic PORT environment variable
COPY --from=builder /app/ui/dist /usr/share/nginx/html
EXPOSE 80 10000 3000
CMD ["sh", "-c", "sed -i \"s/listen[[:space:]]*[0-9]*;/listen ${PORT:-10000};/g\" /etc/nginx/conf.d/default.conf && exec nginx -g \"daemon off;\""]
