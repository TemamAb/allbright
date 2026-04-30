FROM node:20-alpine

WORKDIR /app

# Install dependencies
RUN npm install -g pnpm serve
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy source code and build
COPY . .
# Render injects VITE_API_URL during the build phase
RUN pnpm build

# Serve the static files on Render's dynamic PORT
CMD serve -s dist -l tcp://0.0.0.0:$PORT
