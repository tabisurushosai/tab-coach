#!/usr/bin/env python3
"""
Generate provisional Chrome Web Store screenshots (1280x800) for tab-coach.
Real screenshots will be produced after install; these are placeholders that
illustrate the popup, options page, and badge state visually.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT_DIR = Path(__file__).parent
W, H = 1280, 800

BG = (245, 247, 250)
BG_DARK = (24, 26, 31)
PANEL = (255, 255, 255)
BORDER = (220, 225, 232)
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


def chrome_chrome(draw: ImageDraw.ImageDraw, title: str) -> None:
    # Top browser chrome bar
    draw.rectangle((0, 0, W, 64), fill=(232, 236, 242))
    # Traffic lights
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        cx = 24 + i * 22
        draw.ellipse((cx, 24, cx + 14, 38), fill=c)
    # Address bar
    rounded_rect(draw, (140, 18, W - 220, 46), 14, (255, 255, 255), BORDER, 1)
    draw.text((158, 24), title, fill=MUTED, font=font(16))
    # Extension icon area
    rounded_rect(draw, (W - 200, 18, W - 60, 46), 14, (255, 255, 255), BORDER, 1)


def draw_popup(out: Path) -> None:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    chrome_chrome(d, "chrome://extensions  —  tab-coach")

    # Popup panel anchored under extension icon
    px, py = W - 540, 80
    pw, ph = 460, 620
    rounded_rect(d, (px, py, px + pw, py + ph), 16, PANEL, BORDER, 1)

    # Popup header
    d.text((px + 24, py + 22), "tab-coach", fill=TEXT, font=font(22, True))
    d.text((px + 24, py + 54), "47 タブ / 推奨上限 30", fill=MUTED, font=font(14))

    # Badge mock
    rounded_rect(d, (px + pw - 86, py + 22, px + pw - 24, py + 50), 14, WARN)
    d.text((px + pw - 74, py + 26), "47", fill=(255, 255, 255), font=font(18, True))

    # Tabs (filter chips)
    chips = [("未アクティブ", 12), ("重複", 5), ("読了", 3)]
    cx = px + 24
    for label, n in chips:
        bw = 110
        rounded_rect(d, (cx, py + 92, cx + bw, py + 124), 16, (235, 240, 248), BORDER, 1)
        d.text((cx + 14, py + 100), f"{label} {n}", fill=TEXT, font=font(13))
        cx += bw + 8

    # Tab list
    items = [
        ("React Hooks - 公式", "react.dev/reference/react", "2h 未アクティブ"),
        ("Vite + Vue ガイド", "vitejs.dev/guide", "重複"),
        ("Manifest V3 移行", "developer.chrome.com", "読了 92%"),
        ("Chrome Storage API", "developer.chrome.com", "1h 未アクティブ"),
        ("MDN: Array.prototype", "developer.mozilla.org", "読了 95%"),
        ("Stack Overflow", "stackoverflow.com/q/123", "3h 未アクティブ"),
        ("GitHub: tab-coach", "github.com/tabisurushosai", "重複"),
    ]
    ly = py + 144
    for title, url, tag in items:
        rounded_rect(d, (px + 16, ly, px + pw - 16, ly + 56), 10, (250, 251, 253), BORDER, 1)
        # favicon dot
        d.ellipse((px + 28, ly + 18, px + 48, ly + 38), fill=ACCENT)
        d.text((px + 60, ly + 12), title, fill=TEXT, font=font(14, True))
        d.text((px + 60, ly + 30), url, fill=MUTED, font=font(12))
        d.text((px + pw - 120, ly + 20), tag, fill=DANGER if "重複" in tag else MUTED, font=font(12))
        ly += 64

    # Big action button
    by = py + ph - 72
    rounded_rect(d, (px + 24, by, px + pw - 24, by + 48), 12, ACCENT)
    d.text((px + 168, by + 14), "整理する (20 タブ)", fill=(255, 255, 255), font=font(16, True))

    # Left side caption
    d.text((60, 120), "ワンクリックで\nタブを整理。", fill=TEXT, font=font(56, True))
    d.text((60, 280), "未アクティブ・重複・読了を\n自動分類して提案します。", fill=MUTED, font=font(22))
    d.text((60, 380), "✓ 完全オフライン", fill=OK, font=font(20, True))
    d.text((60, 416), "✓ 個人データ収集なし", fill=OK, font=font(20, True))
    d.text((60, 452), "✓ 広告なし", fill=OK, font=font(20, True))

    img.save(out, format="PNG", optimize=True)


def draw_options(out: Path) -> None:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    chrome_chrome(d, "chrome-extension://…/options.html")

    # Sidebar
    rounded_rect(d, (40, 96, 280, H - 40), 14, PANEL, BORDER, 1)
    d.text((64, 120), "tab-coach", fill=TEXT, font=font(22, True))
    d.text((64, 152), "設定", fill=MUTED, font=font(14))
    nav = ["一般", "ホワイトリスト", "閾値", "アーカイブ", "レポート", "外観"]
    ny = 200
    for i, n in enumerate(nav):
        if i == 2:
            rounded_rect(d, (52, ny - 6, 268, ny + 28), 8, (235, 240, 248))
        d.text((68, ny), n, fill=TEXT if i == 2 else MUTED, font=font(16, i == 2))
        ny += 44

    # Main panel
    rounded_rect(d, (304, 96, W - 40, H - 40), 14, PANEL, BORDER, 1)
    d.text((332, 124), "閾値設定", fill=TEXT, font=font(26, True))
    d.text((332, 160), "未アクティブとみなす時間やバッジ色の境界を調整します。", fill=MUTED, font=font(14))

    # Field 1
    d.text((332, 216), "未アクティブ判定 (分)", fill=TEXT, font=font(16, True))
    rounded_rect(d, (332, 244, 632, 280), 8, (250, 251, 253), BORDER, 1)
    d.text((348, 252), "30", fill=TEXT, font=font(16))
    d.text((332, 290), "既定 30 分。0 でこの分類を無効化。", fill=MUTED, font=font(12))

    # Slider mock for yellow
    d.text((332, 340), "黄色バッジしきい値 (タブ数)", fill=TEXT, font=font(16, True))
    d.rectangle((332, 376, 832, 380), fill=BORDER)
    d.rectangle((332, 376, 532, 380), fill=WARN)
    d.ellipse((522, 368, 542, 388), fill=WARN, outline=PANEL, width=2)
    d.text((848, 368), "20", fill=TEXT, font=font(16, True))

    # Slider mock for red
    d.text((332, 420), "赤色バッジしきい値 (タブ数)", fill=TEXT, font=font(16, True))
    d.rectangle((332, 456, 832, 460), fill=BORDER)
    d.rectangle((332, 456, 732, 460), fill=DANGER)
    d.ellipse((722, 448, 742, 468), fill=DANGER, outline=PANEL, width=2)
    d.text((848, 448), "40", fill=TEXT, font=font(16, True))

    # Read-completion section
    d.text((332, 510), "読了判定", fill=TEXT, font=font(16, True))
    rounded_rect(d, (332, 538, 632, 574), 8, (250, 251, 253), BORDER, 1)
    d.text((348, 546), "スクロール 90% かつ 滞在 60 秒", fill=TEXT, font=font(14))

    # Save button
    rounded_rect(d, (332, 620, 460, 660), 10, ACCENT)
    d.text((366, 630), "保存", fill=(255, 255, 255), font=font(16, True))

    rounded_rect(d, (476, 620, 612, 660), 10, PANEL, BORDER, 1)
    d.text((506, 630), "既定に戻す", fill=TEXT, font=font(14))

    img.save(out, format="PNG", optimize=True)


def draw_badge_warning(out: Path) -> None:
    img = Image.new("RGB", (W, H), BG_DARK)
    d = ImageDraw.Draw(img)
    # Top bar dark
    d.rectangle((0, 0, W, 64), fill=(40, 44, 52))
    for i, c in enumerate([(255, 95, 86), (255, 189, 46), (39, 201, 63)]):
        cx = 24 + i * 22
        d.ellipse((cx, 24, cx + 14, 38), fill=c)
    rounded_rect(d, (140, 18, W - 220, 46), 14, (24, 26, 31), (60, 64, 72), 1)
    d.text((158, 24), "chrome://newtab", fill=(160, 168, 180), font=font(16))
    rounded_rect(d, (W - 200, 18, W - 60, 46), 14, (24, 26, 31), (60, 64, 72), 1)

    # Extension icon (zoomed) with red badge
    zx, zy = W // 2 - 220, 200
    rounded_rect(d, (zx, zy, zx + 440, zy + 440), 60, (255, 255, 255))
    d.text((zx + 70, zy + 130), "TC", fill=ACCENT, font=font(220, True))
    # Red badge
    bx = zx + 280
    by = zy + 280
    rounded_rect(d, (bx, by, bx + 180, by + 110), 32, DANGER)
    d.text((bx + 38, by + 22), "62", fill=(255, 255, 255), font=font(64, True))

    # Caption
    d.text((W // 2 - 260, 80), "タブが増えすぎたら通知", fill=(245, 247, 250), font=font(36, True))
    d.text((W // 2 - 360, 680), "赤バッジでアラート。クリックして「整理する」を1回押すだけ。", fill=(180, 188, 200), font=font(22))

    img.save(out, format="PNG", optimize=True)


def main() -> None:
    draw_popup(OUT_DIR / "01_popup.png")
    draw_options(OUT_DIR / "02_options.png")
    draw_badge_warning(OUT_DIR / "03_badge_warning.png")
    print("done")


if __name__ == "__main__":
    main()
