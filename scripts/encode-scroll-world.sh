#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/.scroll-world-work"
OUT="$ROOT/public/world/flight"
SCENES="intro countersnipe prediction ventures att contact"
CONNECTORS="intro-countersnipe countersnipe-prediction prediction-ventures ventures-att att-contact"

mkdir -p "$OUT"

for name in $SCENES; do
  ffmpeg -y -v error -i "$WORK/dive_$name.mp4" -an \
    -vf "unsharp=5:5:0.8:5:5:0.0" -c:v libx264 -preset slow -crf 20 \
    -pix_fmt yuv420p -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart \
    "$OUT/$name.mp4"
  ffmpeg -y -v error -i "$WORK/still_$name.png" -vf "scale=1800:-2" -frames:v 1 \
    -c:v libwebp -quality 84 "$OUT/$name.webp"
done

# Low-data portrait fallbacks preserve each full authored composition rather
# than letting object-fit crop a landscape still into an accidental close-up.
mkdir -p "$OUT/mobile-posters"
for name in $SCENES; do
  ffmpeg -y -v error -i "$OUT/$name.webp" \
    -filter_complex \
    "[0:v]scale=666:1440:force_original_aspect_ratio=increase,crop=666:1440,gblur=sigma=42[bg];[0:v]scale=666:-2[fg];[bg][fg]overlay=(W-w)/2:250" \
    -frames:v 1 -c:v libwebp -quality 76 -compression_level 6 \
    "$OUT/mobile-posters/$name.webp"
done

for pair in $CONNECTORS; do
  ffmpeg -y -v error -i "$WORK/conn_$pair.mp4" -an \
    -vf "unsharp=5:5:0.8:5:5:0.0" -c:v libx264 -preset slow -crf 20 \
    -pix_fmt yuv420p -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart \
    "$OUT/$pair.mp4"
done
