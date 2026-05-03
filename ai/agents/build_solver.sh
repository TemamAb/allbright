#!/bin/bash
# Build allbright Solver (Rust) — Release mode
# This script runs cargo build and waits for completion.
# Expected output: binary at target/release/allbright.exe (or allbright on *nix)

cd "$(dirname "$0")/.."
echo "[BSS-BUILD] Compiling allbright-solver (release)..."
cargo build --release
echo "[BSS-BUILD] Done. Binary: target/release/allbright$( [ "$OSTYPE" = "msys" ] && echo .exe )"
