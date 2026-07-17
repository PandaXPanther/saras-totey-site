#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/.scroll-world-work/continuous-4k"
OUT="$ROOT/public/world/flight/continuous-flight.mp4"
SCENES=(intro countersnipe prediction ventures att contact)

inputs=()
filters=()
for index in "${!SCENES[@]}"; do
  inputs+=(-i "$WORK/${SCENES[$index]}.mp4")
  filters+=("[$index:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=24,setsar=1,setpts=PTS-STARTPTS[v$index]")
done

filter_graph="$(IFS=';'; echo "${filters[*]}")"
filter_graph+=";[v0][v1]xfade=transition=fade:duration=0.5:offset=7.541667[x1]"
filter_graph+=";[x1][v2]xfade=transition=fade:duration=0.5:offset=15.083334[x2]"
filter_graph+=";[x2][v3]xfade=transition=fade:duration=0.5:offset=19.625001[x3]"
filter_graph+=";[x3][v4]xfade=transition=fade:duration=0.5:offset=24.166668[x4]"
filter_graph+=";[x4][v5]xfade=transition=fade:duration=0.5:offset=27.708335[out]"

ffmpeg -y -v error "${inputs[@]}" \
  -filter_complex "$filter_graph" \
  -map '[out]' -an -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
  -g 8 -keyint_min 8 -sc_threshold 0 -movflags +faststart "$OUT"

echo "Encoded $OUT"
