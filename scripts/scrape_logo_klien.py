#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
============================================================================
SCRAPER LOGO KLIEN — PT. TIMUR ABADI FIBER
============================================================================
Mengambil logo resmi klien waterpark untuk section "Daftar Klien & Proyek
Unggulan". Tanpa dependency eksternal (stdlib only: urllib, json, ssl).

Strategi 3 lapis per klien:
  1. Wikipedia API   — prop=pageimages (logo/foto artikel, resolusi 300px)
  2. Clearbit API    — logo by domain resmi (https://logo.clearbit.com/<domain>)
  3. Google Favicon  — fallback terakhir (https://www.google.com/s2/favicons)

Hasil: assets/img/klien/<slug>.png + laporan konsol per klien.
Logo yang gagal di semua sumber dilaporkan agar bisa dicari manual.

Jalankan:  python scripts/scrape_logo_klien.py
============================================================================
"""
import json
import os
import re
import ssl
import sys
import urllib.parse
import urllib.request

OUT_DIR = os.path.join("assets", "img", "klien")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"}
CTX = ssl.create_default_context()
CTX.check_hostname = False
CTX.verify_mode = ssl.CERT_NONE

# ── DAFTAR KLIEN (12) ────────────────────────────────────────────────────────
# domains : kandidat domain resmi (diurut prioritas)
# sources : urutan sumber per klien (default: wiki → ddg → situs → google)
#           "wiki" sering memberi FOTO artikel, bukan logo — untuk klien
#           yang demikian, mulai dari "ddg" (favicon resmi situs)
KLIENT = [
    {"slug": "jatim-park",   "nama": "Jatim Park 1, 2, 3",       "wikipedia": "Jatim Park 1",              "domains": ["jatimpark.com", "jatimpark3.com"]},
    {"slug": "hawai",        "nama": "Hawai Waterpark",          "wikipedia": "Hawai Waterpark",           "domains": ["hawaiwaterpark.com", "hawaiwaterparkmalang.com"]},
    {"slug": "taman-safari", "nama": "Taman Safari Prigen",      "wikipedia": "Taman Safari",              "domains": ["tamansafari.com"], "sources": ["ddg", "situs"]},
    {"slug": "jogja-bay",    "nama": "Jogja Bay",                "wikipedia": "Jogja Bay Waterpark",       "domains": ["jogjabay.com", "jogjabaywaterpark.com"]},
    {"slug": "banyuwangi",   "nama": "Banyuwangi Waterpark",     "wikipedia": None,                        "domains": ["banyuwangipark.com", "boommarato.com"]},
    {"slug": "sengkaling",   "nama": "Sengkaling Waterpark",     "wikipedia": "Sengkaling",                "domains": ["uls.ac.id", "sengkaling.com"], "sources": ["ddg", "situs"]},
    {"slug": "saigon",       "nama": "Saigon Waterpark",         "wikipedia": "Saigon Waterpark",          "domains": ["saigonwaterpark.com", "cido.com.vn"], "sources": ["wiki", "ddg", "google"]},
    {"slug": "selecta",      "nama": "Selecta & Agrowisata",     "wikipedia": None,                        "domains": ["selectawisata.id", "selectawisata.com"]},
    {"slug": "batam-top",    "nama": "Batam Top 100",            "wikipedia": None,                        "domains": ["top100batam.com", "top100.id"]},
    {"slug": "kuningan",     "nama": "Kuningan Waterpark",       "wikipedia": None,                        "domains": ["kuninganwaterpark.com", "sangkanpark.com"]},
    {"slug": "am-singapur",  "nama": "Am & Singapur WTP",        "wikipedia": None,                        "domains": ["pdamtirtamedan.co.id", "pdam-kotamedan.com"]},
    {"slug": "pangkalpinang","nama": "Pangkal Pinang & Tahuna",  "wikipedia": None,                        "domains": ["pangkalpinangkota.go.id"]},
]

MAX_LOGO_BYTES = 1_200_000  # logo > 1.2MB hampir pasti foto, bukan logo


def http_get(url, timeout=20):
    """GET URL, kembalikan bytes. None jika gagal."""
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
            return r.read()
    except Exception as e:
        print(f"      ! {url[:80]} → {type(e).__name__}")
        return None


def is_image(data, max_bytes=MAX_LOGO_BYTES):
    """Validasi bytes benar-benar gambar (PNG/JPEG/WEBP/SVG) & ukuran wajar utk logo."""
    if not data or len(data) < 500 or len(data) > max_bytes:
        return False
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return True
    if data[:3] == b"\xff\xd8\xff":
        return True
    if b"RIFF" == data[:4] and b"WEBP" == data[8:12]:
        return True
    if b"<svg" in data[:500].lower():
        return True
    return False


def simpan(slug, data, sumber):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, f"{slug}.png")
    with open(path, "wb") as f:
        f.write(data)
    print(f"   ✓ TERSIMPAN ({sumber}, {len(data)//1024} KB) → {path}")
    return True


# ── SUMBER 1: WIKIPEDIA ──────────────────────────────────────────────────────
def dari_wikipedia(judul):
    """Coba id.wikipedia lalu en.wikipedia."""
    for lang in ("id", "en"):
        api = (f"https://{lang}.wikipedia.org/w/api.php?action=query&prop=pageimages"
               f"&piprop=original|thumbnail&pithumbsize=400&format=json&redirects=1"
               f"&titles={urllib.parse.quote(judul)}")
        raw = http_get(api)
        if not raw:
            continue
        try:
            pages = json.loads(raw).get("query", {}).get("pages", {})
            for p in pages.values():
                for k in ("original", "thumbnail"):
                    src = p.get(k, {}).get("source")
                    if src:
                        data = http_get(src)
                        if is_image(data):
                            return data, src
        except Exception:
            continue
    return None


# ── SUMBER 2: DUCKDUCKGO ICONS (pengganti Clearbit) ────────────────────────
def dari_duckduckgo(domain):
    url = f"https://icons.duckduckgo.com/ip3/{domain}.ico"
    data = http_get(url)
    if is_image(data) and len(data) > 1500:  # >1.5KB agar bukan placeholder generik
        return data, url
    return None


# ── SUMBER 3: SCRAPE SITUS RESMI (og:image / apple-touch-icon / icon) ──────
RE_OG = re.compile(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)', re.I)
RE_OG2 = re.compile(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image', re.I)
RE_TOUCH = re.compile(r'<link[^>]+rel=["\']apple-touch-icon["\'][^>]+href=["\']([^"\']+)', re.I)
RE_ICON = re.compile(r'<link[^>]+rel=["\'][^"\']*icon[^"\']*["\'][^>]+href=["\']([^"\']+)', re.I)
RE_ICON2 = re.compile(r'<link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\'][^"\']*icon[^"\']*["\']', re.I)
RE_TITLE_IMG = re.compile(r'<img[^>]+src=["\']([^"\']*(?:logo|brand)[^"\']*)["\']', re.I)


def dari_situs(domain):
    """Buka homepage, cari og:image / touch-icon / icon / img logo."""
    for scheme in ("https://", "https://www."):
        home = http_get(scheme + domain, timeout=15)
        if not home:
            continue
        try:
            html = home.decode("utf-8", errors="ignore")
        except Exception:
            continue
        kandidat = []
        for rex in (RE_OG, RE_OG2, RE_TOUCH, RE_ICON, RE_ICON2, RE_TITLE_IMG):
            kandidat += rex.findall(html)
        for href in kandidat[:6]:
            if href.startswith("//"):
                href = "https:" + href
            elif href.startswith("/"):
                href = "https://" + domain + href
            elif not href.startswith("http"):
                href = "https://" + domain + "/" + href
            # skip tracker/icon kecil umum
            if any(x in href.lower() for x in ("favicon", ".ico", "pixel", ".js")):
                continue
            data = http_get(href, timeout=15)
            if is_image(data) and len(data) > 3000:
                return data, href
    return None


# ── SUMBER 4: GOOGLE FAVICON (fallback terakhir) ────────────────────────────
def dari_google(domain):
    for size in (128, 64):
        url = f"https://www.google.com/s2/favicons?sz={size}&domain={domain}"
        data = http_get(url)
        if is_image(data) and len(data) > 1500:
            return data, url
    return None


# ── SUMBER 2: CLEARBIT (domain resmi) ───────────────────────────────────────
def dari_clearbit(domain):
    url = f"https://logo.clearbit.com/{domain}?size=400"
    data = http_get(url)
    if is_image(data):
        return data, url
    return None


# ── SUMBER 3: GOOGLE FAVICON (fallback) ─────────────────────────────────────
def dari_google(domain):
    for size in (128, 64):
        url = f"https://www.google.com/s2/favicons?sz={size}&domain={domain}"
        data = http_get(url)
        if is_image(data):
            return data, url
    return None


# ── MAIN ─────────────────────────────────────────────────────────────────────
def main():
    print("=" * 70)
    print("SCRAPER LOGO KLIEN — PT. TIMUR ABADI FIBER")
    print("=" * 70)
    hasil, gagal = [], []
    for k in KLIENT:
        print(f"\n▶ {k['nama']}")
        dapat = None
        urutan = k.get("sources", ["wiki", "ddg", "situs", "google"])
        for sumber in urutan:
            if sumber == "wiki" and k.get("wikipedia"):
                print("   [wiki] Wikipedia …")
                dapat = dari_wikipedia(k["wikipedia"])
            elif sumber == "ddg":
                for d in k["domains"]:
                    print(f"   [ddg] DuckDuckGo {d} …")
                    dapat = dari_duckduckgo(d)
                    if dapat:
                        break
            elif sumber == "situs":
                for d in k["domains"]:
                    print(f"   [situs] {d} …")
                    dapat = dari_situs(d)
                    if dapat:
                        break
            elif sumber == "google":
                for d in k["domains"]:
                    print(f"   [google] {d} …")
                    dapat = dari_google(d)
                    if dapat:
                        break
            if dapat:
                break
        if dapat:
            data, src = dapat
            simpan(k["slug"], data, src.split("/")[2] if "//" in src else src)
            hasil.append(k["slug"])
        else:
            print("   ✗ GAGAL di semua sumber — perlu pencarian manual")
            gagal.append(k["nama"])

    print("\n" + "=" * 70)
    print(f"HASIL: {len(hasil)}/{len(KLIENT)} logo tersimpan → {OUT_DIR}/")
    if gagal:
        print("Perlu manual:")
        for g in gagal:
            print(f"  - {g}")
    print("=" * 70)
    return 0 if not gagal else 1


if __name__ == "__main__":
    sys.exit(main())
