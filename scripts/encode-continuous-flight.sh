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
# H.264 remains the broadest Safari/Chromium option. Preserve more of the 4K
# source detail at 1440p, and use a deliberate two-pass budget so the file stays
# below Cloudflare Pages' 25 MiB per-file limit without the old CRF 31/ultrafast
# macroblocking. Frequent keyframes keep scroll seeking responsive.
PASSLOG="$(mktemp -u /tmp/saras-flight-pass.XXXXXX)"
ffmpeg -y -v error -f concat -safe 0 -i "$LIST" \
  -vf scale=2560:1440:flags=lanczos -an -c:v libx264 -preset slow -b:v 5400k \
  -pix_fmt yuv420p -profile:v high -level 5.1 -g 12 -keyint_min 12 -sc_threshold 0 \
  -pass 1 -passlogfile "$PASSLOG" -f null /dev/null
ffmpeg -y -v error -f concat -safe 0 -i "$LIST" \
  -vf scale=2560:1440:flags=lanczos -an -c:v libx264 -preset slow -b:v 5400k \
  -pix_fmt yuv420p -profile:v high -level 5.1 -g 12 -keyint_min 12 -sc_threshold 0 \
  -pass 2 -passlogfile "$PASSLOG" -movflags +faststart "$OUT"
rm -f "${PASSLOG}"*

echo "Encoded hard-cut H.264 chain to $OUT"
