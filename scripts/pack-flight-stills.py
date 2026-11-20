"""Export sharp, individually cacheable desktop views from the original flight."""
import argparse
from pathlib import Path
import subprocess

FLIGHT = Path(__file__).resolve().parents[1] / "public/world/flight"
STRIDE = 3
LAST_FRAME = 821


def pack_stills(ffmpeg):
    output = FLIGHT / "stills-v4" / "wide"
    output.mkdir(parents=True, exist_ok=True)
    filters = f"select='not(mod(n,{STRIDE}))+eq(n,{LAST_FRAME})',unsharp=5:5:0.72:5:5:0"
    subprocess.run([
        ffmpeg, "-v", "error", "-y", "-threads", "4", "-filter_threads", "3",
        "-i", str(FLIGHT / "continuous-flight.mp4"), "-vf", filters,
        "-an", "-fps_mode", "vfr", "-c:v", "libwebp",
        "-quality", "78", "-compression_level", "3", "-threads", "6",
        "-start_number", "0", str(output / "%03d.webp"),
    ], check=True)
    expected = (LAST_FRAME + STRIDE - 1) // STRIDE + 1
    if len(list(output.glob("*.webp"))) != expected:
        raise ValueError(f"Expected {expected} desktop stills")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ffmpeg", default="ffmpeg")
    pack_stills(parser.parse_args().ffmpeg)
