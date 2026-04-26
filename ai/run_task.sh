#!/bin/bash

# Detect project root relative to script location
BASE="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

TASK="$1"

if [ -z "$TASK" ]; then
  echo "❌ Missing task"
  exit 1
fi

echo "🧠 BRIGHTSKY EXECUTION START (GASLESS MODE ENABLED)"

TASK_FILE="$BASE/ai/task.txt"
OUTPUT_FILE="$BASE/ai/output.txt"
MEMORY="$BASE/ai/memory/memory.json"
KOIS="$BASE/ai/telemetry/kois.json"

echo "$TASK" > "$TASK_FILE"

# Verify solver binary exists
# Note: In a Rust workspace, the binary is at the root 'target' folder.
SOLVER_BIN="$BASE/target/release/brightsky.exe"

if [ ! -f "$SOLVER_BIN" ]; then
  echo "⚠️ Solver binary missing. Attempting to build..."
  cargo build --release --bin brightsky
  if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check Rust errors."
    exit 1
  fi
fi

# ----------------------------
# BUILD
# ----------------------------
echo "⚙️ BUILD (Verifying 8-chain sync & KPI alignment...)"
# Use timeout to allow the solver to initialize and log KPIs, then move to Audit
# 15s is usually enough for BSS-05 to establish WebSocket heartbeats
timeout 15s "$SOLVER_BIN" < "$TASK_FILE" > "$OUTPUT_FILE" 2>&1
echo "✅ Build logs captured."

# ----------------------------
# AUDIT
# ----------------------------
echo "🔍 AUDIT (AA + RPC efficiency check)"
AUDIT=$(bash "$BASE/ai/brightsky-auditor.sh" \
  --task "$TASK_FILE" \
  --output "$OUTPUT_FILE" \
  --memory "$MEMORY")

echo "$AUDIT"

# ----------------------------
# KOI LOAD
# ----------------------------
if [ -f "$KOIS" ]; then
    echo "📊 KOI METRICS (free-tier optimized)"
    cat "$KOIS"
fi

# ----------------------------
# DEPLOY GATE
# ----------------------------
if [[ "$AUDIT" == *"APPROVED"* ]]; then
    echo "✅ APPROVED — DEPLOYING"
    git add .
    git commit -m "auto(ai): $TASK"
    git push
    echo "🚀 DEPLOYED (Render)"
else
    echo "⛔ REJECTED (KPI Target Missed) - Invoking Debugger"
    bash "$BASE/ai/brightsky-debugger.sh"
    exit 1
fi

echo "🏁 COMPLETE"
