FROM node:20-alpine

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the React app
RUN pnpm build

# Expose the port (default 4173 for vite preview)
EXPOSE 4173

# Serve the static files
CMD ["pnpm", "run", "preview", "--host", "0.0.0.0"]
