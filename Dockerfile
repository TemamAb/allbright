FROM node:20-alpine

# Install build essentials for native modules and pnpm
RUN apk add --no-cache python3 make g++ curl bash

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9.12.2

# Copy dependency files first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Run install - prioritize frozen lockfile, fall back to full install if needed
RUN pnpm install --frozen-lockfile || pnpm install

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
