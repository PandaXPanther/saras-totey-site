"""Create seek-free motion atlases from the original island flight."""
import argparse
from pathlib import Path
import subprocess

FLIGHT = Path(__file__).resolve().parents[1] / "public/world/flight"
SOURCE = FLIGHT / "continuous-flight.mp4"

# Six tiles keep each decoded sheet small enough for mobile webviews.
VARIANTS = {
    "wide": ("", (192, 108), (1280, 720)),
    "portrait": ("crop=900:1440:996:0,", (125, 200), (800, 1280)),
}


def encode(ffmpeg, destination, crop, size, step, grid, quality, sharpen=""):
    width, height = size
    selection = f"select='not(mod(n,{step}))+eq(n,821)'"
    filters = f"{selection},{crop}scale={width}:{height}:flags=lanczos,{sharpen}tile={grid}"
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
        directory = FLIGHT / "motion-v2" / name
        directory.mkdir(parents=True, exist_ok=True)
        encode(args.ffmpeg, directory / "overview.webp", crop, overview, 12, "10x7", 59)
        encode(args.ffmpeg, directory / "%02d.webp", crop, motion, 2, "3x2", 74, "unsharp=5:5:0.30:5:5:0,")

    # A sharper whole-route preview covers jumps before nearby motion sheets arrive.
    previews = FLIGHT / "overview-v3"
    previews.mkdir(parents=True, exist_ok=True)
    for name, size in (("wide", (320, 180)), ("portrait", (230, 368))):
        encode(args.ffmpeg, previews / (name + ".webp"), VARIANTS[name][0], size, 12, "10x7", 57)
