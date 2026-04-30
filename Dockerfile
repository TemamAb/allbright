# syntax=docker/dockerfile:1
FROM rust:1.88-slim-bookworm AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    clang \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Relax network timeouts and retries for weak network connections
ENV CARGO_NET_RETRY=10
ENV CARGO_HTTP_TIMEOUT=120

# Reduce compilation jobs to prevent Out-Of-Memory (OOM) crashes on limited-RAM cloud providers
ENV CARGO_BUILD_JOBS=1

COPY Cargo.toml Cargo.lock rust-toolchain.toml ./
COPY solver ./solver

RUN cargo build --jobs 1 --locked --release --bin brightsky

FROM debian:bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/brightsky /usr/local/bin/brightsky

ENV PORT=10000
EXPOSE 10000

CMD ["brightsky"]
