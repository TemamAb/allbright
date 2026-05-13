# Run cargo test for solver
cd c:/Users/op/Desktop/allbright/solver
cargo test --no-run 2>&1 | Select-Object -First 50
