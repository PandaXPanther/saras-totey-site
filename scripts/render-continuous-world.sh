#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/.scroll-world-work/continuous-4k"
PROMPTS="$ROOT/scripts/scroll-world-prompts/continuous"
SCENES=(intro countersnipe prediction ventures att contact)

mkdir -p "$WORK"

for index in "${!SCENES[@]}"; do
  scene="${SCENES[$index]}"
  if [[ -s "$WORK/$scene.mp4" && -s "$WORK/$scene-last.png" ]]; then
    echo "Keeping completed $scene"
    continue
  fi
  if (( index == 0 )); then
    start="$ROOT/.scroll-world-work/still_intro.png"
  else
    previous="${SCENES[$((index - 1))]}"
    start="$WORK/${previous}-last.png"
  fi

  if (( index < 2 )); then
    duration=8
    resolution=4k
  elif (( index >= 4 )); then
    duration=4
    resolution=1080p
  else
    duration=5
    resolution=1080p
  fi

  higgsfield generate create seedance_2_0 \
    --prompt "$(<"$PROMPTS/$scene.txt")" \
    --start-image "$start" \
    --image "$ROOT/.scroll-world-work/still_intro.png" \
    --aspect_ratio 16:9 --duration "$duration" --mode std --resolution "$resolution" \
    --generate_audio false --wait --wait-timeout 25m --json \
    > "$WORK/$scene.json" 2> "$WORK/$scene.err"

  url="$(jq -r '.[0].result_url // empty' "$WORK/$scene.json")"
  if [[ -z "$url" ]]; then
    echo "Generation failed for $scene" >&2
    exit 1
  fi

  curl -fsSL "$url" -o "$WORK/$scene.mp4"
  ffmpeg -y -v error -sseof -0.05 -i "$WORK/$scene.mp4" -frames:v 1 "$WORK/$scene-last.png"
  echo "Rendered $scene from $(basename "$start")"
done
