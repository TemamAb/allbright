# syntax=docker/dockerfile:1
# ─── STAGE 1: Planner for cargo-chef ────────────────────────────────────────────────
FROM rust:1.86-slim AS planner
RUN cargo install cargo-chef
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN cargo chef prepare --recipe-path recipe.json

# ─── STAGE 2: Cache dependencies ────────────────────────────────────────────────
FROM rust:1.86-slim AS cacher
RUN cargo install cargo-chef
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# ─── STAGE 3: Rust Builder ────────────────────────────────────────────────
FROM rust:1.86-slim AS builder
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libclang-dev \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY --from=cacher /app/target target
COPY --from=cacher $CARGO_HOME $CARGO_HOME

COPY main.rs ./
COPY bss_*.rs ./
RUN cargo build --release --bin brightsky-solver

# ─── STAGE 4: Node Runtime ──────────────────────────────────────────────────
FROM node:22-bookworm-slim AS node-runtime

# Copy pre-built API server from host (built locally)
WORKDIR /app
COPY artifacts/api-server/dist ./artifacts/api-server/dist
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/api-server/node_modules ./artifacts/api-server/node_modules

# ─── STAGE 5: Final Image ────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Rust solver
COPY --from=builder /app/target/release/brightsky-solver ./brightsky

# Copy Node runtime from node stage
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/
COPY --from=node-runtime /usr/local/bin/npm /usr/local/bin/
COPY --from=node-runtime /usr/local/lib/node_modules /usr/local/lib/node_modules/
COPY --from=node-runtime /app/artifacts /app/artifacts

ENV NODE_PATH=/usr/local/lib/node_modules
ENV PORT=3000

# Expose API port
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "\
    echo 'Starting BrightSky Solver...' && \
    ./brightsky & \
    echo 'Starting API Server on :3000...' && \
    cd artifacts/api-server && \
    node ./dist/index.mjs && \
    wait"]