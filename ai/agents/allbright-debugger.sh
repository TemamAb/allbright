#!/bin/bash
# allbright local debugger agent

BASE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_FILE="$BASE/output.txt"

echo "🔍 DEBUGGER: Analyzing failure state against KPIs..."

if grep -q "AA20 account not deployed" "$OUTPUT_FILE"; then
    echo "FIX: SimpleAccountFactory address in api/src/routes/engine.ts is likely incorrect for current CHAIN_ID."
fi

if grep -q "Success Rate" "$OUTPUT_FILE"; then
    echo "KPI FAILURE (Benchmark #2): Low success rate. Suggestion: Recalibrate BSS-43 simulation depth or tighten BSS-45 Risk gates."
fi

if grep -q "Sim Parity Delta" "$OUTPUT_FILE"; then
    echo "KPI FAILURE (Benchmark #8): Simulation Drift. Suggestion: Verify Liquidity Modeling (BSS-44) or update Fee Estimation in BSS-05."
fi

if grep -q "RPC Sync Lag" "$OUTPUT_FILE"; then
    echo "KPI FAILURE (Benchmark #7): High RPC Lag. Suggestion: Switch to a private RPC endpoint or check network latency to Base nodes."
fi

if grep -q "undefined/api" "$OUTPUT_FILE"; then
    echo "FIX: Build-time injection failed. Ensure VITE_API_BASE_URL is exported before 'pnpm build'."
fi
