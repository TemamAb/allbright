#!/bin/bash

BASE="C:/Users/op/Desktop/brightsky"

echo "📡 BRIGHTSKY OBSERVER (GASLESS + KPI TRACKING)"

while true; do
  echo "----------------------"
  echo "TIME: $(date)"
  echo "KOI:"
  cat "$BASE/ai/telemetry/kois.json"
  echo "MEMORY:"
  cat "$BASE/ai/memory/memory.json"
  sleep 5
done
