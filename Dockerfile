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

# Copy real source from root
COPY main.rs ./
COPY bss_*.rs ./
RUN cargo build --release --bin brightsky-solver

# ─── STAGE 4: Final Image ──────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy pre-built Rust binary
COPY --from=builder /app/target/release/brightsky-solver ./brightsky

# Copy pre-built frontend (already built locally in artifacts/brightsky/dist)
COPY artifacts/brightsky/dist ./artifacts/brightsky/dist

# Expose ports (Rust API:4001, Frontend:3000)
EXPOSE 3000 4001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4001/health || exit 1

# Multi-service entrypoint
CMD ["sh", "-c", "\
    echo 'Starting Rust API on :4001...' && \
    ./brightsky & \
    echo 'Starting frontend server...' && \
    cd artifacts/brightsky && \
    npx serve -s dist -l 3000 && \
    wait"]