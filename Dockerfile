FROM node:20-alpine AS builder
WORKDIR /app

# BSS-64: Stabilize Corepack & PNPM Home for Monorepo Build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration for pnpm
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig*.json ./
COPY ui/package.json ./ui/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/db/package.json ./lib/db/
# BSS-66: Copy remaining workspace members to ensure pnpm dependency linking
COPY api/package.json ./api/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/ts/package.json ./lib/ts/

# Install all workspace dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY ui/ ./ui/
COPY lib/ ./lib/
COPY api/ ./api/

# Build the Production Dashboard
WORKDIR /app/ui
RUN CI=false pnpm run build

FROM nginx:stable-alpine
COPY ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/ui/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["sh", "-c", "sed -i \"s/listen[[:space:]]*[0-9]*;/listen ${PORT:-3000};/g\" /etc/nginx/conf.d/default.conf && exec nginx -g \"daemon off;\""]
