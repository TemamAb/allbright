FROM node:20-alpine

# Install build essentials for native modules
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm serve

# Copy only dependency files first to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

# Clean install ignoring scripts
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Inject API URL at build time for Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build the dashboard
RUN pnpm build

# Serve on the dynamic port provided by Render
EXPOSE $PORT
CMD serve -s dist -l $PORT
