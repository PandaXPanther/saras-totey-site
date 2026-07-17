#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PROMPTS="$ROOT/scripts/scroll-world-prompts"
WORK="$ROOT/.scroll-world-work"
NAMES="intro countersnipe prediction ventures contact"

mkdir -p "$WORK"

generate_still() {
  local name="$1"
  higgsfield generate create nano_banana_2 \
    --prompt "$(<"$PROMPTS/still_$name.txt")" \
    --aspect_ratio 3:2 --resolution 2k --wait --wait-timeout 20m --json \
    > "$WORK/still_$name.json" 2> "$WORK/still_$name.err"
  local url
  url="$(jq -r '.[0].result_url // empty' "$WORK/still_$name.json")"
  if [[ -n "$url" ]]; then
    curl -fsSL "$url" -o "$WORK/still_$name.png"
    echo "still $name ok"
  else
    echo "still $name failed"
  fi
}

for name in $NAMES; do
  generate_still "$name" &
done
wait
