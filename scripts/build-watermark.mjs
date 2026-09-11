#!/usr/bin/env node
/* ==========================================================================
   WATERMARK ENGINE — CV. TIMUR ABADI FIBER (c) jpXCode
   Tahap 2 anti-clone: proteksi aset gambar.
   --------------------------------------------------------------------------
   Lapisan 1 (HALUS, digital-watermarking): pola dither 1-bit frekuensi
     tinggi yang TIDAK terlihat di layar (sub-persepsi) tetapi muncul jelas
     saat foto di-reencode (screenshot → WhatsApp → kompresi) atau
     di-level/contrast-adjust oleh pencuri. Otomatis cocok dgn arah konten.
   Lapisan 2 (TERLIHAT): teks miring tipis "CV. TIMUR ABADI FIBER" berulang
     diagonal di seluruh foto — merusak nilai komersial foto curian.
   Ketebalan & opasitas skalares mengikuti ukuran gambar.
   Sumber TIDAK disentuh (dirawat di repo); versi ber-watermark menimpa file
   publik. card.png & hero-waterpark.jpg (master tanpa rujukan) diblokir
   dari akses publik via vercel.json.
   Pakai:  node scripts/build-watermark.mjs
   ========================================================================== */
import sharp from 'sharp';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = join(ROOT, 'assets', 'img');
const CACHE = join(IMG, '.wm-cache');
mkdirSync(CACHE, { recursive: true });

const BRAND = 'CV. TIMUR ABADI FIBER';

/* ── SVG watermark berlapis untuk satu dimensi (di-cache per ukuran) ── */
function wmSvg(w, h) {
  const key = `${w}x${h}`;
  const f = join(CACHE, key + '.svg');
  if (existsSync(f)) return readFileSync(f, 'utf8');
  const small = Math.min(w, h);
  /* Lapisan 2: teks diagonal berulang (seluruh permukaan) */
  const fs = Math.max(13, Math.round(small * 0.033));
  const gap = Math.round(fs * 2.6);
  let texts = '';
  for (let y = -h; y < h * 2; y += gap) {
    for (let x = -w; x < w * 2; x += Math.round(fs * 9)) {
      texts += `<text x="${x}" y="${y}" transform="rotate(-28 ${x} ${y})" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${fs}" fill="#FFFFFF" fill-opacity="0.085" stroke="#0B1B3D" stroke-opacity="0.05" stroke-width="0.5">${BRAND}</text>`;
    }
  }
  /* Lapisan 1: dither 1-bit freq-tinggi (bloom saat reencode) + pixel-guard
     2px di tepi (rusak saat crop). Ukuran sel = 3px device-independent. */
  let dots = '';
  const cell = 3;
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      if (((x / cell + y / cell) & 1) === 0) {
        dots += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1" fill="#FFFFFF" fill-opacity="0.028"/>`;
      } else {
        dots += `<rect x="${x + 1}" y="${y + 1}" width="1" height="1" fill="#000000" fill-opacity="0.022"/>`;
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><g>${texts}</g><g>${dots}</g></svg>`;
  writeFileSync(f, svg);
  return svg;
}

/* ── Tanda tangan: lebar + hash buffer sumber (skip jika sumber tak berubah) ── */
import { createHash } from 'crypto';

const TARGETS = [
  'hero-waterpark.webp',
  'card.webp',
  'galeri-gerbang.webp',
  'galeri-slide.webp',
  'galeri-wahana.webp',
  'layanan-1-konstruksi.webp', 'layanan-1-480.webp',
  'layanan-2-design.webp', 'layanan-2-480.webp',
  'layanan-3-renovasi.webp', 'layanan-3-480.webp',
  'layanan-4-playground.webp', 'layanan-4-480.webp',
  'layanan-5-maintenance.webp', 'layanan-5-480.webp',
  'layanan-6-painting.webp', 'layanan-6-480.webp',
  'tahap-1-konsultasi.webp',
  'tahap-2-desain.webp',
  'tahap-3-fabrikasi.webp',
  'tahap-4-instalasi.webp',
  'tahap-5-serah-terima.webp',
];

let ok = 0, skip = 0, fail = 0;
for (const name of TARGETS) {
  const src = join(IMG, name);
  try {
    if (!existsSync(src)) { console.log('MISSING', name); fail++; continue; }
    const buf = readFileSync(src);
    const meta = await sharp(buf).metadata();
    const hash = createHash('md5').update(buf).digest('hex').slice(0, 8);
    const sigFile = join(CACHE, name + '.sig');
    if (existsSync(sigFile) && readFileSync(sigFile, 'utf8') === hash + '|' + meta.width) {
      skip++; continue;
    }
    const composite = Buffer.from(wmSvg(meta.width, meta.height));
    const out = await sharp(buf)
      .composite([{ input: composite, blend: 'over' }])
      .webp({ quality: 78, effort: 4 })
      .toBuffer();
    writeFileSync(src, out);
    writeFileSync(sigFile, hash + '|' + meta.width);
    console.log('WM', name, `${meta.width}x${meta.height}`, (out.length / 1024).toFixed(0) + 'KB');
    ok++;
  } catch (err) {
    console.error('FAIL', name, err.message);
    fail++;
  }
}
console.log(`\nSelesai: ${ok} watermarked, ${skip} unchanged, ${fail} gagal.`);
process.exit(fail ? 1 : 0);
