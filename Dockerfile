# Build stage
FROM node:20-alpine AS builder
# Add dependencies for Rust/Native builds if needed
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

# Build the API and the UI
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm --filter @workspace/api build
RUN pnpm --filter ui build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy workspace config and dependencies
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules

# Copy API artifacts
COPY --from=builder /app/api/package.json ./api/
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/api/node_modules ./api/node_modules

# Copy UI artifacts (for the API to serve)
COPY --from=builder /app/ui/dist ./ui/dist

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "api/dist/index.js"]
