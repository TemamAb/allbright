#!/bin/bash
set -e

echo "─── BRIGHTSKY AUDIT FRAMEWORK v2.0 – BUILD/DEPLOY AUDIT ───"

AUDIT_PASSED=true

# 1. Compile: cargo test --release 10/10 pass
echo "─── 1. COMPILATION AUDIT ───"
if command -v cargo &> /dev/null; then
    echo "Running cargo build --release --bin brightsky..."
    if cargo build --release --bin brightsky 2>&1; then
        echo "✓ Compilation successful"
    else
        echo "✗ Compilation failed - attempting auto-fix"
        # Auto-fix: check Cargo.toml syntax
        if grep -q '^  "[^"]*"' Cargo.toml && ! grep -q '^members = \[' Cargo.toml; then
            echo "Detected incomplete workspace config in Cargo.toml - fixing"
            sed -i '1i[workspace]\nmembers = [' Cargo.toml
            echo "Fixed Cargo.toml workspace config"
            # Retry build
            if cargo build --release --bin brightsky 2>&1; then
                echo "✓ Compilation successful after fix"
            else
                echo "✗ Compilation still failed"
                AUDIT_PASSED=false
            fi
        else
            AUDIT_PASSED=false
        fi
    fi

    echo "Running cargo test --release..."
    if cargo test --release 2>&1; then
        echo "✓ All tests passed"
    else
        echo "✗ Some tests failed - manual intervention required"
        AUDIT_PASSED=false
    fi
else
    echo "✗ Cargo not installed"
    AUDIT_PASSED=false
fi

# 2. Docker: Multi-stage COPY complete
echo "─── 2. DOCKER AUDIT ───"
if [ -f "Dockerfile" ]; then
    # Check if COPY commands are present and in order
    if grep -q "COPY Cargo.toml Cargo.lock" Dockerfile && \
       grep -q "COPY solver/Cargo.toml" Dockerfile && \
       grep -q "COPY solver/src" Dockerfile; then
        echo "✓ Dockerfile COPY commands appear complete"
    else
        echo "✗ Dockerfile missing required COPY commands"
        AUDIT_PASSED=false
    fi
else
    echo "✗ Dockerfile not found"
    AUDIT_PASSED=false
fi

# 3. Mod Paths: subsystems/mod.rs + pub mod bss_xx
echo "─── 3. MODULE PATHS AUDIT ───"
MOD_FILE="solver/src/subsystems/mod.rs"
if [ -f "$MOD_FILE" ]; then
    # Get list of bss_*.rs files
    existing_mods=$(ls solver/src/subsystems/bss_*.rs | sed 's|.*/bss_\([0-9]*\)_.*|\1|' | sort -n)

    # Check declared mods in mod.rs
    declared_mods=$(grep "^pub mod bss_[0-9]*_" "$MOD_FILE" | sed 's/pub mod bss_\([0-9]*\)_.*;/\1/' | sort -n)

    # Find missing declarations
    missing_mods=""
    for mod_num in $existing_mods; do
        if ! echo "$declared_mods" | grep -q "^$mod_num$"; then
            missing_mods="$missing_mods $mod_num"
        fi
    done

    # Find extra declarations (files that don't exist)
    extra_mods=""
    for mod_num in $declared_mods; do
        if ! echo "$existing_mods" | grep -q "^$mod_num$"; then
            extra_mods="$extra_mods $mod_num"
        fi
    done

    if [ -n "$missing_mods" ]; then
        echo "✗ Missing mod declarations for:$missing_mods - fixing"
        for mod_num in $missing_mods; do
            mod_name=$(ls solver/src/subsystems/bss_${mod_num}_*.rs | sed 's|.*/\(bss_[0-9]*_[^/]*\)\.rs|\1|')
            # Insert after the last pub mod line
            sed -i "/^pub mod bss_[0-9]*_/a pub mod $mod_name;" "$MOD_FILE"
            # Also add to pub use
            sed -i "/^pub use bss_[0-9]*_/a pub use $mod_name::*;" "$MOD_FILE"
        done
        echo "✓ Added missing mod declarations"
    fi

    if [ -n "$extra_mods" ]; then
        echo "✗ Extra mod declarations for non-existent files:$extra_mods - fixing"
        for mod_num in $extra_mods; do
            mod_name=$(grep "^pub mod bss_${mod_num}_" "$MOD_FILE" | sed 's/pub mod \(bss_[0-9]*_[^;]*\);/\1/')
            sed -i "/^pub mod $mod_name;/d" "$MOD_FILE"
            sed -i "/^pub use $mod_name::\*;/d" "$MOD_FILE"
        done
        echo "✓ Removed extra mod declarations"
    fi

    # Check for typos like 'ppub'
    if grep -q "^ppub mod" "$MOD_FILE"; then
        echo "✗ Typo 'ppub' found - fixing"
        sed -i 's/^ppub mod/pub mod/' "$MOD_FILE"
        echo "✓ Fixed typo"
    fi

    echo "✓ Module paths verified and fixed"
else
    echo "✗ subsystems/mod.rs not found"
    AUDIT_PASSED=false
fi

# 4. Render: Secrets/env health path
echo "─── 4. RENDER ENVIRONMENT AUDIT ───"
if [ -f ".env.example" ]; then
    required_vars=("DATABASE_URL" "RPC_ENDPOINT" "PIMLICO_API_KEY")
    missing_vars=""
    for var in "${required_vars[@]}"; do
        if ! grep -q "$var" .env.example; then
            missing_vars="$missing_vars $var"
        fi
    done
    if [ -n "$missing_vars" ]; then
        echo "✗ Missing environment variables in .env.example:$missing_vars - adding"
        for var in $missing_vars; do
            echo "$var=your_$var_here" >> .env.example
        done
        echo "✓ Added missing env vars to .env.example"
    else
        echo "✓ Environment template complete"
    fi
else
    echo "✗ .env.example not found - creating"
    cat > .env.example << EOF
DATABASE_URL=your_database_url_here
RPC_ENDPOINT=your_rpc_endpoint_here
PIMLICO_API_KEY=your_pimlico_api_key_here
EOF
    echo "✓ Created .env.example"
fi

# Final verdict
echo "─── AUDIT RESULTS ───"
if [ "$AUDIT_PASSED" = true ]; then
    echo "🎉 AUDIT PASSED - Ready for Render deployment"
    exit 0
else
    echo "❌ AUDIT FAILED - Issues detected and some fixed, manual review required"
    exit 1
fi