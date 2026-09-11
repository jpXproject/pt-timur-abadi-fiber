#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NORMALISASI LOGO KLIEN — seragamkan ke PNG ≤256px, rapi utk web.
Jalankan: python scripts/normalize_logo.py
"""
import os
from PIL import Image

DIR = os.path.join("assets", "img", "klien")
MAX = 256

for f in sorted(os.listdir(DIR)):
    if not f.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        continue
    path = os.path.join(DIR, f)
    try:
        img = Image.open(path)
    except Exception as e:
        print(f"✗ {f}: {e}")
        continue
    asli = img.size
    # skala proporsional sisi terpanjang → MAX
    img.thumbnail((MAX, MAX), Image.LANCZOS)
    # PNG: pertahankan transparansi; JPEG sumber → konversi dgn bg putih
    if img.mode in ("RGBA", "LA", "P"):
        img = img.convert("RGBA")
    else:
        bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
        bg.paste(img.convert("RGBA"), mask=None)
        img = bg
    out = os.path.splitext(path)[0] + ".png"
    img.save(out, "PNG", optimize=True)
    kb = os.path.getsize(out) // 1024
    print(f"✓ {f} {asli[0]}x{asli[1]} → {os.path.basename(out)} {img.size[0]}x{img.size[1]} ({kb} KB)")
