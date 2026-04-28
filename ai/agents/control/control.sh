#!/bin/bash

BASE="C:/Users/op/Desktop/brightsky"

case "$1" in
  status)
     cat "$BASE/ai/metrics/kois.json"
    ;;
  memory)
     cat "$BASE/ai/agents/memory/memory.json"
    ;;
  *)
    echo "commands: status | memory"
    ;;
esac
