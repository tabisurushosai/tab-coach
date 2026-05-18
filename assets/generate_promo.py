#!/usr/bin/env python3
"""
Generate Chrome Web Store promotional tile images for tab-coach.

Outputs:
  - assets/promo_small.png   (440x280)   small promo tile (required)
  - assets/promo_marquee.png (1400x560)  marquee promo tile (optional, T088)

Both are placeholders generated locally with Pillow; the real artwork can
replace these files later without code changes.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT_DIR = Path(__file__).parent

BG_TOP = (37, 99, 235)       # blue-600
BG_BOTTOM = (29, 78, 216)    # blue-700
PANEL = (255, 255, 255)
TEXT = (32, 36, 44)
MUTED = (110, 118, 130)
ACCENT = (59, 130, 246)
DANGER = (220, 56, 56)
WARN = (234, 168, 0)
OK = (52, 168, 83)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def rounded_rect(draw: ImageDraw.ImageDraw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def vertical_gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size, top)
    px = img.load()
    for y in range(h):
        t = y / max(1, h - 1)
        r = int(top[0] + (bottom[0] - top[0]) * t)
        g = int(top[1] + (bottom[1] - top[1]) * t)
        b = int(top[2] + (bottom[2] - top[2]) * t)
        for x in range(w):
            px[x, y] = (r, g, b)
    return img


def draw_app_tile(d: ImageDraw.ImageDraw, cx: int, cy: int, size: int) -> None:
    """Draw a stylized TC app icon with a red badge."""
    half = size // 2
    rounded_rect(d, (cx - half, cy - half, cx + half, cy + half), size // 5, PANEL)
    d.text((cx - int(size * 0.36), cy - int(size * 0.46)), "TC", fill=ACCENT, font=font(int(size * 0.85), True))
    # red badge in corner
    bw, bh = int(size * 0.55), int(size * 0.32)
    bx = cx + half - bw + int(size * 0.10)
    by = cy + half - bh + int(size * 0.10)
    rounded_rect(d, (bx, by, bx + bw, by + bh), bh // 2, DANGER)
    label = "47"
    tw = d.textlength(label, font=font(int(bh * 0.75), True))
    d.text((bx + (bw - tw) / 2, by + bh * 0.10), label, fill=(255, 255, 255), font=font(int(bh * 0.75), True))


def draw_promo_small(out: Path) -> None:
    W, H = 440, 280
    img = vertical_gradient((W, H), BG_TOP, BG_BOTTOM)
    d = ImageDraw.Draw(img)

    # Decorative panel on the right
    draw_app_tile(d, cx=W - 90, cy=H // 2, size=150)

    # Headline + sub
    d.text((24, 36), "tab-coach", fill=(255, 255, 255), font=font(34, True))
    d.text((24, 82), "タブを整理。\n集中を取り戻す。", fill=(229, 235, 247), font=font(22, True))

    # bullet list
    bullets = ["完全オフライン", "個人データ収集なし", "広告なし"]
    by = 178
    for b in bullets:
        d.ellipse((24, by + 6, 36, by + 18), fill=(167, 243, 208))
        d.text((46, by), b, fill=(229, 235, 247), font=font(14, True))
        by += 22

    img.save(out, format="PNG", optimize=True)


def draw_promo_marquee(out: Path) -> None:
    W, H = 1400, 560
    img = vertical_gradient((W, H), BG_TOP, BG_BOTTOM)
    d = ImageDraw.Draw(img)

    # Right-side mock card stack
    base_x = W - 520
    base_y = 80
    rounded_rect(d, (base_x, base_y, base_x + 460, base_y + 400), 22, PANEL)
    d.text((base_x + 28, base_y + 24), "tab-coach", fill=TEXT, font=font(28, True))
    d.text((base_x + 28, base_y + 64), "47 タブ / 推奨上限 30", fill=MUTED, font=font(16))
    rounded_rect(d, (base_x + 360, base_y + 26, base_x + 432, base_y + 58), 16, WARN)
    d.text((base_x + 376, base_y + 32), "47", fill=(255, 255, 255), font=font(18, True))

    rows = [
        ("React Hooks - 公式", "2h 未アクティブ", MUTED),
        ("Vite + Vue ガイド", "重複", DANGER),
        ("Manifest V3 移行", "読了 92%", OK),
        ("MDN: Array.prototype", "読了 95%", OK),
        ("Stack Overflow", "3h 未アクティブ", MUTED),
    ]
    ry = base_y + 100
    for title, tag, color in rows:
        rounded_rect(d, (base_x + 20, ry, base_x + 440, ry + 48), 10, (250, 251, 253), (220, 225, 232), 1)
        d.ellipse((base_x + 32, ry + 16, base_x + 48, ry + 32), fill=ACCENT)
        d.text((base_x + 60, ry + 8), title, fill=TEXT, font=font(14, True))
        d.text((base_x + 60, ry + 28), tag, fill=color, font=font(12))
        ry += 56

    # Headline
    d.text((80, 110), "tab-coach", fill=(255, 255, 255), font=font(72, True))
    d.text((80, 210), "ワンクリックでタブを整理。\n集中を取り戻す。", fill=(229, 235, 247), font=font(40, True))

    # Bullet list
    bullets = [
        ("完全オフライン", "通信ゼロ・全処理ローカル"),
        ("個人データ収集なし", "ブラウザ外送信は一切ありません"),
        ("広告なし", "1.0 から永久に表示しません"),
    ]
    by = 380
    for title, sub in bullets:
        d.ellipse((80, by + 12, 100, by + 32), fill=(167, 243, 208))
        d.text((116, by), title, fill=(255, 255, 255), font=font(22, True))
        d.text((116, by + 28), sub, fill=(199, 214, 240), font=font(16))
        by += 56

    img.save(out, format="PNG", optimize=True)


def main() -> None:
    draw_promo_small(OUT_DIR / "promo_small.png")
    draw_promo_marquee(OUT_DIR / "promo_marquee.png")
    print("done")


if __name__ == "__main__":
    main()
