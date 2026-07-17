#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$ROOT/.scroll-world-work/continuous-chain-v8"
PROMPTS="$ROOT/scripts/scroll-world-prompts/continuous"
SCENES=(intro countersnipe prediction ventures att contact)

mkdir -p "$WORK/boundaries"

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

  duration=6
  if [[ "$scene" == "ventures" ]]; then
    duration=4
  fi

  higgsfield generate create seedance_2_0 \
    --prompt "$(<"$PROMPTS/$scene.txt")" \
    --start-image "$start" \
    --aspect_ratio 16:9 \
    --duration "$duration" \
    --mode std \
    --resolution 4k \
    --bitrate_mode high \
    --generate_audio false \
    --wait \
    --wait-timeout 30m \
    --json \
    > "$WORK/$scene.json" 2> "$WORK/$scene.err"

  url="$(jq -r '.[0].result_url // empty' "$WORK/$scene.json")"
  if [[ -z "$url" ]]; then
    echo "Generation failed for $scene" >&2
    exit 1
  fi

  curl -fsSL "$url" -o "$WORK/$scene.mp4"
  frame_count="$(ffprobe -v error -select_streams v:0 -show_entries stream=nb_frames -of csv=p=0 "$WORK/$scene.mp4")"
  ffmpeg -y -v error -i "$WORK/$scene.mp4" \
    -vf "select=eq(n\\,$((frame_count - 1)))" -vsync 0 "$WORK/$scene-last.png"

  if (( index > 0 )); then
    previous="${SCENES[$((index - 1))]}"
    ffmpeg -y -v error -i "$WORK/$scene.mp4" -frames:v 1 \
      "$WORK/boundaries/${index}-${scene}-first.png"
    cp "$start" "$WORK/boundaries/${index}-${previous}-last.png"
    ffmpeg -i "$start" -i "$WORK/boundaries/${index}-${scene}-first.png" \
      -lavfi '[0:v]scale=1920:1080[a];[1:v]scale=1920:1080[b];[a][b]ssim' \
      -f null - 2> "$WORK/boundaries/${index}-${previous}-to-${scene}.ssim"
    grep 'SSIM' "$WORK/boundaries/${index}-${previous}-to-${scene}.ssim" | tail -1
  fi

  echo "Rendered $scene from $(basename "$start") at 4K high bitrate"

  if [[ "${STOP_AFTER:-}" == "$scene" ]]; then
    exit 0
  fi
done
