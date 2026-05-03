FROM node:20-alpine

# Install build essentials for native modules
RUN apk add --no-cache python3 make g++ curl

WORKDIR /app

# Enable corepack and use specific pnpm version
RUN corepack enable && corepack prepare pnpm@9.12.2 --activate

# Copy only dependency files first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Run install without frozen lockfile first to ensure compatibility
# Then run with frozen lockfile to lock versions
RUN pnpm install --no-frozen-lockfile
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Inject API URL at build time for Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the dashboard
RUN pnpm build

# Serve on the dynamic port provided by Render
EXPOSE $PORT
CMD ["pnpm", "exec", "serve", "-s", "dist", "-l", "$PORT"]
