# syntax=docker/dockerfile:1
# AllBright Solver Dockerfile - Root Context Build
FROM rust:1.80-slim AS builder

WORKDIR /app

# Install dependencies for building
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy solver source and build
COPY solver/Cargo.toml solver/Cargo.lock solver/src ./solver/
COPY rust-toolchain.toml ./
COPY lib/db/src ./lib/db/src
COPY lib/ts/src ./lib/ts/src

# Build the solver
WORKDIR /app/solver
RUN cargo build --release --manifest-path Cargo.toml

FROM debian:bookworm-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the built binary from builder
COPY --from=builder /app/solver/target/release/allbright .

# Expose IPC port
EXPOSE 4001

CMD ["./allbright"]
