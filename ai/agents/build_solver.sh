#!/bin/bash
# Build BrightSky Solver (Rust) — Release mode
# This script runs cargo build and waits for completion.
# Expected output: binary at target/release/brightsky.exe (or brightsky on *nix)

cd "$(dirname "$0")/.."
echo "[BSS-BUILD] Compiling brightsky-solver (release)..."
cargo build --release
echo "[BSS-BUILD] Done. Binary: target/release/brightsky$( [ "$OSTYPE" = "msys" ] && echo .exe )"
