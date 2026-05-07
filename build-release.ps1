# Build script with optimizations for low disk space
$env:LIBBYTEBOS_ = "1"
$env:CARGO_INCREMENTAL = "0"

cd "c:/Users/op/Desktop/allbright/tauri/src-tauri"

Write-Host "Building with minimal temp space requirements..."
cargo build --release
