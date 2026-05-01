FROM node:20-alpine

WORKDIR /app

# Install pnpm and serve globally
RUN npm install -g pnpm serve

# Copy dependency files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

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
