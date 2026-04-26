#!/bin/bash

BASE="C:/Users/op/Desktop/brightsky"

case "$1" in
  status)
    cat "$BASE/ai/telemetry/kois.json"
    ;;
  memory)
    cat "$BASE/ai/memory/memory.json"
    ;;
  *)
    echo "commands: status | memory"
    ;;
esac
