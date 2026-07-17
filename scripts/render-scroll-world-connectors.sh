#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPTS="$ROOT/scripts/scroll-world-prompts"
WORK="$ROOT/.scroll-world-work"
PAIRS="intro-countersnipe countersnipe-prediction prediction-ventures ventures-att att-contact"

generate_connector() {
  local pair="$1"
  local from="${pair%%-*}"
  local to="${pair##*-}"
  higgsfield generate create seedance_2_0_mini \
    --prompt "$(<"$PROMPTS/conn_$pair.txt")" \
    --start-image "$WORK/last_$from.png" --end-image "$WORK/first_$to.png" \
    --resolution 720p --aspect_ratio 16:9 --duration 5 \
    --wait --wait-timeout 20m --json > "$WORK/conn_$pair.json" 2> "$WORK/conn_$pair.err"
  local url
  url="$(jq -r '.[0].result_url // empty' "$WORK/conn_$pair.json")"
  if [[ -n "$url" ]]; then
    curl -fsSL "$url" -o "$WORK/conn_$pair.mp4"
    echo "connector $pair ok"
  else
    echo "connector $pair failed"
  fi
}

for pair in $PAIRS; do
  generate_connector "$pair" &
done
wait
