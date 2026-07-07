"""Generate the Open Graph share image using PIL. Deterministic, no AI.
Run: python3 scripts/make_og.py
Writes: public/og.png (1200x630)
"""
from PIL import Image, ImageDraw, ImageFont
import os, random
random.seed(7)

W, H = 1200, 630
BG = (5, 7, 13)
LINE = (60, 74, 106)
TEXT = (230, 237, 246)
DIM = (150, 162, 184)
FAINT = (93, 106, 130)
ACCENT = (155, 181, 255)

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# Background orderbook silhouette
def draw_bars(y_center, sign, count=52, seed_val=7):
    random.seed(seed_val)
    center = W // 2
    for i in range(count):
        x_pos = center + (i - count // 2) * 18
        dist = abs(i - count // 2)
        import math
        base = 0.4 + random.random() * 1.6 * math.exp(-dist * 0.05)
        h = int(base * 130)
        color = (76, 106, 136) if sign < 0 else (92, 115, 152)
        y1 = y_center
        y2 = y_center + sign * h
        top = min(y1, y2)
        bot = max(y1, y2)
        draw.rectangle([x_pos - 5, top, x_pos + 5, bot], fill=color)

draw_bars(H // 2 - 4, -1, seed_val=7)
draw_bars(H // 2 + 4, 1, seed_val=13)

# Faint grid
for i in range(-6, 7):
    y = H // 2 + i * 45
    draw.line([(0, y), (W, y)], fill=(58, 69, 96, 40), width=1)

# Dark vignette (draw a translucent overlay by blending)
overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
odr = ImageDraw.Draw(overlay)
# Radial-ish darkening: draw big transparent gradient by simulating with ellipses
for r in range(700, 0, -60):
    alpha = int(180 * (1 - r / 700))
    odr.ellipse([W // 2 - r * 1.4, H // 2 - r, W // 2 + r * 1.4, H // 2 + r], fill=(5, 7, 13, 0))
# Simple full dark overlay
odr.rectangle([0, 0, W, H], fill=(5, 7, 13, 90))
img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
draw = ImageDraw.Draw(img)

# Fonts (try locally installed then fallback)
def find_font(size, bold=False, italic=False, serif=False):
    candidates = []
    if serif:
        candidates += [
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Italic.ttf" if italic else "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSerif-Italic.ttf" if italic else "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
        ]
    if bold:
        candidates += [
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
        ]
    candidates += [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for c in candidates:
        if os.path.exists(c):
            return ImageFont.truetype(c, size)
    return ImageFont.load_default()

f_eyebrow = find_font(20)
f_title_1 = find_font(84, serif=True, bold=True)
f_title_2 = find_font(84, serif=True, italic=True)
f_sub = find_font(26)
f_meta = find_font(18)
f_footer = find_font(20)

# Eyebrow
draw.text((80, 90), "INDEPENDENT QUANTITATIVE SYSTEMS", fill=FAINT, font=f_eyebrow, spacing=8)

# Title
y = 150
draw.text((80, y), "Saras Totey.", fill=TEXT, font=f_title_1)
y += 100
draw.text((80, y), "Real capital.", fill=TEXT, font=f_title_2)
y += 100
draw.text((80, y), "Verifiable numbers.", fill=DIM, font=f_title_1)

# Bottom row
draw.line([(80, H - 100), (W - 80, H - 100)], fill=LINE, width=1)
draw.text((80, H - 78), "SARASTOTEY.COM", fill=TEXT, font=f_meta)
draw.text((80, H - 50), "CS2 skins · Kalshi · Polymarket · Hyperliquid", fill=DIM, font=f_meta)

# Right side stats
r_x = W - 80
stats = [
    ("$1,424", "live capital deployed"),
    ("14.1%", "avg return / trade"),
    ("396%", "cohort 90d ROI"),
]
sy = H - 220
for v, k in stats:
    tw = draw.textlength(v, font=f_footer)
    draw.text((r_x - tw, sy), v, fill=TEXT, font=f_footer)
    tw2 = draw.textlength(k, font=f_meta)
    draw.text((r_x - tw2, sy + 26), k, fill=FAINT, font=f_meta)
    sy += 60

os.makedirs("public", exist_ok=True)
img.save("public/og.png", "PNG", optimize=True)
print("Wrote public/og.png")
