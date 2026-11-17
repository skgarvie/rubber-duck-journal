#!/usr/bin/env python3
"""Generate rubber-duck PNG icons with the standard library only (no Pillow).

Usage: python3 tools/make-icons.py
Writes into public/icons/. The artwork matches public/icons/icon.svg and keeps
everything inside the maskable safe zone (central 80% circle).
"""
import os
import struct
import zlib

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "icons")

BG = (29, 78, 216)         # #1d4ed8 brand blue
BODY = (250, 204, 21)      # #facc15
WING = (234, 179, 8)       # #eab308
BEAK = (249, 115, 22)      # #f97316
EYE = (17, 17, 17)
SHINE = (255, 255, 255)

# Shapes in unit coordinates, drawn in order (later shapes on top).
# ("ellipse", cx, cy, rx, ry, colour)
SHAPES = [
    ("ellipse", 0.50, 0.62, 0.28, 0.17, BODY),   # body
    ("ellipse", 0.27, 0.53, 0.07, 0.05, BODY),   # tail
    ("ellipse", 0.45, 0.61, 0.14, 0.075, WING),  # wing
    ("ellipse", 0.79, 0.435, 0.085, 0.04, BEAK), # beak
    ("ellipse", 0.62, 0.40, 0.14, 0.14, BODY),   # head
    ("ellipse", 0.665, 0.37, 0.024, 0.024, EYE), # eye
    ("ellipse", 0.672, 0.362, 0.008, 0.008, SHINE),
]

SS = 3  # supersampling factor per axis


def colour_at(x, y):
    c = BG
    for _, cx, cy, rx, ry, col in SHAPES:
        dx = (x - cx) / rx
        dy = (y - cy) / ry
        if dx * dx + dy * dy <= 1.0:
            c = col
    return c


def render(size):
    rows = []
    inv = 1.0 / (size * SS)
    for py in range(size):
        row = bytearray([0])  # filter type 0
        for px in range(size):
            r = g = b = 0
            for sy in range(SS):
                y = (py * SS + sy + 0.5) * inv
                for sx in range(SS):
                    x = (px * SS + sx + 0.5) * inv
                    cr, cg, cb = colour_at(x, y)
                    r += cr
                    g += cg
                    b += cb
            n = SS * SS
            row += bytes((r // n, g // n, b // n))
        rows.append(bytes(row))
    return b"".join(rows)


def png(size, raw):
    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)  # 8-bit RGB
    return (b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr)
            + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))


def main():
    os.makedirs(OUT, exist_ok=True)
    targets = {
        "apple-touch-icon.png": 180,
        "icon-192.png": 192,
        "icon-512.png": 512,
        "icon-maskable-512.png": 512,
    }
    cache = {}
    for name, size in targets.items():
        if size not in cache:
            cache[size] = png(size, render(size))
        with open(os.path.join(OUT, name), "wb") as f:
            f.write(cache[size])
        print(f"wrote public/icons/{name} ({size}x{size})")


if __name__ == "__main__":
    main()
