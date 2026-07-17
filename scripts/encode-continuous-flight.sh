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
# H.264 is required for reliable Chromium/Safari playback; 1080p keeps the
# continuous 34-second flight below Cloudflare Pages' per-file upload limit.
ffmpeg -y -v error -f concat -safe 0 -i "$LIST" \
  -vf scale=1920:1080:flags=fast_bilinear -an -c:v libx264 -preset ultrafast -crf 31 \
  -pix_fmt yuv420p -profile:v baseline -level 4.2 \
  -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart "$OUT"

echo "Encoded hard-cut H.264 chain to $OUT"
