# syntax=docker/dockerfile:1
# Multi-stage build for BrightSky Rust Solver
FROM rust:1.88-bookworm AS builder

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY src ./src

RUN cargo build --release

# Production stage: slim runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y libssl3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/brightsky .

EXPOSE 4003

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD bash -c "echo > /dev/tcp/localhost/4003" || exit 1

CMD ["./brightsky"]
