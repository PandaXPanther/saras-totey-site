"""Create seek-free motion atlases from the original island flight."""
import argparse
from pathlib import Path
import subprocess

FLIGHT = Path(__file__).resolve().parents[1] / "public/world/flight"
SOURCE = FLIGHT / "continuous-flight.mp4"

# Each sheet stays within 4096 pixels per side for mobile webviews.
VARIANTS = {
    "wide": ("", (192, 108), (768, 432)),
    "portrait": ("crop=900:1440:996:0,", (125, 200), (480, 768)),
}


def encode(ffmpeg, destination, crop, size, step, grid, quality):
    width, height = size
    selection = f"select='not(mod(n,{step}))+eq(n,821)'"
    filters = f"{selection},{crop}scale={width}:{height}:flags=lanczos,tile={grid}"
    subprocess.run([
        ffmpeg, "-v", "error", "-y", "-threads", "4", "-filter_threads", "3",
        "-i", str(SOURCE), "-an", "-vf", filters, "-fps_mode", "vfr",
        "-c:v", "libwebp", "-quality", str(quality), "-compression_level", "4",
        "-threads", "4", "-start_number", "0", str(destination),
    ], check=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", default="ffmpeg")
    args = parser.parse_args()
    for name, (crop, overview, motion) in VARIANTS.items():
        directory = FLIGHT / "motion-v1" / name
        directory.mkdir(parents=True, exist_ok=True)
        encode(args.ffmpeg, directory / "overview.webp", crop, overview, 12, "10x7", 59)
        encode(args.ffmpeg, directory / "%02d.webp", crop, motion, 2, "4x3", 68)
