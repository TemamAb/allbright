# syntax=docker/dockerfile:1
# Multi-stage build for Allbright Rust Solver
FROM rust:1.88-bookworm AS builder

WORKDIR /app

# 1. Copy only Cargo.toml first to cache dependency builds
#    Cargo.lock is NOT checked in for the solver subdirectory;
#    cargo will generate it from Cargo.toml during the build.
COPY Cargo.toml ./
RUN mkdir -p src && echo "fn main() {}" > src/main.rs && \
    echo "pub fn stub() {}" > src/lib.rs
RUN cargo build --release 2>/dev/null || true

# 2. Now copy the actual source code
COPY . .
# Touch main.rs to ensure cargo knows it needs to rebuild the binary
# Build WITHOUT the 'desktop' feature (no tauri/GTK dependencies)
RUN touch src/main.rs && cargo build --release --bin allbright

# Production stage: slim runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/allbright .

EXPOSE 4003

# Use curl for HTTP health check (matches Render's healthCheckPath)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-4003}/health || exit 1

CMD ["./allbright"]
