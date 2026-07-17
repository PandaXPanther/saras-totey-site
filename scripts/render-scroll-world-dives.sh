#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPTS="$ROOT/scripts/scroll-world-prompts"
WORK="$ROOT/.scroll-world-work"
NAMES="intro countersnipe prediction ventures att contact"

generate_dive() {
  local name="$1"
  higgsfield generate create seedance_2_0_mini \
    --prompt "$(<"$PROMPTS/dive_$name.txt")" \
    --start-image "$WORK/still_$name.png" \
    --resolution 720p --aspect_ratio 16:9 --duration 8 \
    --wait --wait-timeout 20m --json > "$WORK/dive_$name.json" 2> "$WORK/dive_$name.err"
  local url
  url="$(jq -r '.[0].result_url // empty' "$WORK/dive_$name.json")"
  if [[ -n "$url" ]]; then
    curl -fsSL "$url" -o "$WORK/dive_$name.mp4"
    echo "dive $name ok"
  else
    echo "dive $name failed"
  fi
}

TARGETS="${*:-$NAMES}"
for name in $TARGETS; do
  generate_dive "$name" &
done
wait
