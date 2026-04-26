# syntax=docker/dockerfile:1
# Multi-stage build for BrightSky Rust Solver
FROM rust:1.88-bookworm AS builder

WORKDIR /app

# 1. Create a dummy project to cache dependencies
RUN mkdir -p solver/src && echo "fn main() {}" > solver/src/main.rs
COPY Cargo.toml Cargo.lock ./
# If you have workspace members, ensure their Cargo.toml files are copied too
RUN cargo build --release || true

# 2. Now copy the actual source code
COPY . .
# Touch main.rs to ensure cargo knows it needs to rebuild the binary
RUN touch solver/src/main.rs && cargo build --release --bin brightsky

# Production stage: slim runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/brightsky .

EXPOSE 4003

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD bash -c "echo > /dev/tcp/localhost/4003" || exit 1

CMD ["./brightsky"]
