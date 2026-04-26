#!/bin/bash
# BrightSky local auditor shim

BASE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
OUTPUT_FILE="$BASE/output.txt"

# Basic validation: Check if output contains critical errors or 'undefined' endpoints
if grep -q "undefined" "$OUTPUT_FILE"; then
    echo "REJECTED: Undefined API endpoint detected in build output."
    exit 1
fi

# BSS-45 Risk Check: Simulation Anomaly Detection
if grep -q "BSS-45: Simulation anomaly" "$OUTPUT_FILE"; then
    echo "REJECTED: Risk engine detected simulation deviation > 20% (Potential Frontrun)."
    exit 1
fi

# KPI Check: Minimum Success Rate (Unified Benchmark #2: 95%)
if grep -qE "Success Rate: ([0-8][0-9]|9[0-4])\." "$OUTPUT_FILE"; then
    echo "REJECTED: Success rate below 95% benchmark."
    exit 1
fi

# KPI Check: Sim Parity Delta (Unified Benchmark #8: 2.5 bps)
if grep -qE "Sim Parity Delta: ([3-9]|[1-9][0-9])" "$OUTPUT_FILE" || grep -q "Sim Parity Delta: 2\.[6-9]" "$OUTPUT_FILE"; then
    echo "REJECTED: Simulation Parity Delta exceeds 2.5 bps benchmark."
    exit 1
fi

# KPI Check: RPC Sync Lag (Unified Benchmark #7: 12.5ms target, 100ms hard limit)
if grep -q "RPC Sync Lag: [1-9][0-9][0-9]\." "$OUTPUT_FILE"; then
    echo "REJECTED: RPC Sync Lag exceeds 100ms safety threshold."
    exit 1
fi

# BSS-46: Final Profit Projection Verification (Looking for the logic, not just a static number)
if ! grep -qiE "Profit Logic|14\.[0-9]+|BSS-26" "$OUTPUT_FILE"; then
    echo "REJECTED: Output missing Alpha-Max profit projection or deterministic logic."
    exit 1
fi

echo "APPROVED"