#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/.scroll-world-work/continuous-chain-v8"
OUT="$ROOT/public/world/flight/continuous-flight.mp4"
SCENES=(intro countersnipe prediction ventures att contact)
LIST="$WORK/concat.txt"

: > "$LIST"
for scene in "${SCENES[@]}"; do
  printf "file '%s/%s.mp4'\n" "$WORK" "$scene" >> "$LIST"
done

# Every generated clip begins from the previous clip's literal final frame.
# Hard concatenation preserves that continuity. Crossfades/blends are forbidden.
ffmpeg -y -v error -f concat -safe 0 -i "$LIST" \
  -an -c:v libx265 -tag:v hvc1 -preset medium -crf 27 -pix_fmt yuv420p \
  -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart "$OUT"

echo "Encoded hard-cut 4K chain to $OUT"
