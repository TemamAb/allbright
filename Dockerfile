# Build stage
FROM node:20-alpine AS builder
RUN apk add --no-cache python3 make g++ curl bash
WORKDIR /app
RUN npm install -g pnpm@9.12.2
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

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
