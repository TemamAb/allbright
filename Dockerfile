# Build stage
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ curl bash
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9.12.2

# Copy pnpm configuration and all package.json files for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY api/package.json ./api/
COPY ui/package.json ./ui/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY lib/ts/package.json ./lib/ts/

# Install dependencies for all workspaces
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter ui build # Explicitly build only the UI package

# Production stage
FROM node:20-alpine
RUN npm install -g serve
WORKDIR /app
# Copy built assets from the builder stage
# Note: Workspace builds typically place UI assets in ui/dist
COPY --from=builder /app/ui/dist ./dist

ENV PORT=3000
EXPOSE 3000

CMD ["sh", "-c", "serve -s dist -l $PORT"]
