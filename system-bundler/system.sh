#!/usr/bin/env bash

set -e

LOG_DIR="logs"
mkdir -p $LOG_DIR

RESULT_FILE="result.json"
FAILED_STAGE_FILE=".last_failed_stage"

echo "🧠 FULL GATEKEEPER + AUTO-HEAL SYSTEM START"

write_ok () {
  echo "{\"status\":\"ok\"}" > $RESULT_FILE
}

write_fail () {
  STAGE=$1
  echo "{\"status\":\"fail\",\"stage\":\"$STAGE\"}" > $RESULT_FILE
  echo "$STAGE" > $FAILED_STAGE_FILE
}

auto_heal () {
  echo "🛠️ AUTO-HEAL TRIGGERED"

  if [ ! -f $FAILED_STAGE_FILE ]; then
    echo "❌ No failed stage found"
    return 1
  fi

  STAGE=$(cat $FAILED_STAGE_FILE)

  case "$STAGE" in
    "deps")
      echo "🔁 Healing deps..."
      rm -rf api/node_modules web/node_modules || true
      ;;
    "types")
      echo "🔁 Clearing build caches..."
      rm -rf api/dist web/.next || true
      ;;
    "build")
      echo "🔁 Rebuild cleanup..."
      rm -rf bot/target || true
      ;;
    "ports")
      echo "🔁 Killing ports..."
      lsof -ti :3000 | xargs kill -9 2>/dev/null || true
      lsof -ti :3001 | xargs kill -9 2>/dev/null || true
      ;;
  esac
}

run_stage () {
  NAME=$1
  CMD=$2

  echo "➡️ STAGE: $NAME"

  $CMD > "$LOG_DIR/${NAME}.log" 2>&1 || {
    echo "❌ FAILED: $NAME"
    write_fail "$NAME"
    auto_heal
    exit 1
  }
}

run_stage "deps" bash -c '
cd api && npm install
cd ../web && npm install
cd ../bot && cargo fetch
'

run_stage "types" bash -c '
cd api && npx tsc --noEmit
cd ../web && npx tsc --noEmit
cd ../bot && cargo check
'

run_stage "build" bash -c '
cd api && npm run build
cd ../web && npm run build
cd ../bot && cargo build
'

run_stage "env" bash -c '
node -e "if(!process.env.PORT){process.exit(1)}"
'

run_stage "ports" bash -c '
lsof -i :3000 || true
lsof -i :3001 || true
'

echo "🚀 STARTING SERVICES"
cd api && node dist/index.js > ../logs/api.log 2>&1 &
API_PID=$!

cd ../bot && RUST_LOG=debug cargo run > ../logs/bot.log 2>&1 &
BOT_PID=$!

cd ../web && npm run dev > ../logs/web.log 2>&1 &
WEB_PID=$!

sleep 5

run_stage "runtime" bash -c '
curl -s http://localhost:3000 >/dev/null
'

echo "{\"status\":\"ok\"}" > result.json

echo "📦 PACKAGING..."
zip -r system_bundle.zip api web bot logs result.json .last_failed_stage >/dev/null 2>&1 || true

trap "kill $API_PID $BOT_PID $WEB_PID 2>/dev/null || true" EXIT
wait
