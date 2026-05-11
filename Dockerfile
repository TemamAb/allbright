# syntax=docker/dockerfile:1
# AllBright Solver Dockerfile - Root Context Build
FROM rust:1.88-slim AS builder

WORKDIR /app

# Install dependencies for building
RUN apt-get update && apt-get install -y pkg-config libssl-dev libicu-dev && rm -rf /var/lib/apt/lists/*

# Copy all source files for build
COPY . .

# Build the solver using workspace manifest
RUN cargo build --release --manifest-path solver/Cargo.toml

FROM debian:bookworm-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy the built binary from builder
COPY --from=builder /app/solver/target/release/allbright .

# Expose IPC port
EXPOSE 4001

CMD ["./allbright"]
