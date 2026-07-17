#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/.scroll-world-work"
OUT="$ROOT/public/world/flight"
SCENES="intro countersnipe prediction ventures contact"
CONNECTORS="intro-countersnipe countersnipe-prediction prediction-ventures ventures-contact"

mkdir -p "$OUT"

for name in $SCENES; do
  ffmpeg -y -v error -i "$WORK/dive_$name.mp4" -an \
    -vf "unsharp=5:5:0.8:5:5:0.0" -c:v libx264 -preset slow -crf 20 \
    -pix_fmt yuv420p -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart \
    "$OUT/$name.mp4"
  ffmpeg -y -v error -i "$WORK/still_$name.png" -vf "scale=1800:-2" -frames:v 1 \
    -c:v libwebp -quality 84 "$OUT/$name.webp"
done

for pair in $CONNECTORS; do
  ffmpeg -y -v error -i "$WORK/conn_$pair.mp4" -an \
    -vf "unsharp=5:5:0.8:5:5:0.0" -c:v libx264 -preset slow -crf 20 \
    -pix_fmt yuv420p -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart \
    "$OUT/$pair.mp4"
done
