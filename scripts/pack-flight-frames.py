"""Build scroll-ready WebP frame packs from the original continuous flight."""

import argparse
import json
import math
import statistics
import struct
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FLIGHT = ROOT / "public/world/flight"
SOURCE = FLIGHT / "continuous-flight.mp4"
FRAMES_PER_PACK = 24
FRAME_COUNT = 822


def pack_frames(ffmpeg, scratch):
    output = FLIGHT / "frames" / "wide"
    output.mkdir(parents=True, exist_ok=True)
    subprocess.run([
        ffmpeg, "-v", "error", "-y", "-threads", "3", "-i", str(SOURCE),
        "-vf", "scale=1920:1080:flags=lanczos", "-an", "-c:v", "libwebp", "-quality", "76",
        "-compression_level", "3", "-threads", "6", str(scratch / "%04d.webp"),
    ], check=True)
    frames = sorted(scratch.glob("*.webp"))
    if len(frames) != FRAME_COUNT:
        raise ValueError(f"Expected {FRAME_COUNT} frames, found {len(frames)}")
    for first in range(0, len(frames), FRAMES_PER_PACK):
        images = [path.read_bytes() for path in frames[first:first + FRAMES_PER_PACK]]
        path = output / f"{first // FRAMES_PER_PACK:02}.bin"
        with path.open("wb") as stream:
            stream.write(struct.pack(f"<I{len(images)}I", len(images), *(len(image) for image in images)))
            for image in images:
                stream.write(image)
    for frame, name in ((605, "roblox"), (682, "misc")):
        (FLIGHT / f"{name}.webp").write_bytes(frames[frame].read_bytes())


def measure_pacing(ffmpeg):
    # Give fast sections more scroll distance and shorten near-still holds.
    pixels = 48 * 27
    raw = subprocess.check_output([
        ffmpeg, "-v", "error", "-i", str(SOURCE), "-vf", "scale=48:27:flags=area",
        "-pix_fmt", "gray", "-f", "rawvideo", "-",
    ])
    if len(raw) != FRAME_COUNT * pixels:
        raise ValueError("Unexpected timeline length")
    frames = [raw[start:start + pixels] for start in range(0, len(raw), pixels)]
    differences = [0] + [
        sum(abs(a - b) for a, b in zip(after, before)) / pixels
        for before, after in zip(frames, frames[1:])
    ]
    median = statistics.median(differences)
    travel = 0.0
    path = [0]
    for i in range(1, len(frames)):
        local = statistics.mean(differences[max(1, i - 6):i + 7])
        pace = max(.48, min(1.56, math.sqrt(local / median)))
        # The beam masks a transition and should pass faster than open scenery.
        travel += .20 if 336 < i <= 348 else pace
        path.append(round(travel, 4))
    rows = [json.dumps(path[i:i + FRAMES_PER_PACK])[1:-1] for i in range(0, len(path), FRAMES_PER_PACK)]
    (ROOT / "src/data/flight-pacing.json").write_text(
        "[\n  " + ",\n  ".join(rows) + "\n]\n", encoding="utf-8", newline="\n",
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", default="ffmpeg")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory() as temporary:
        pack_frames(args.ffmpeg, Path(temporary))
    measure_pacing(args.ffmpeg)
