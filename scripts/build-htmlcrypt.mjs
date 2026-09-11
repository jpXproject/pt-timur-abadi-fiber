#!/usr/bin/env node
/* ==========================================================================
   HTML CRYPT — CV. TIMUR ABADI FIBER (c) jpXCode
   Tahap 2 anti-clone: obfuscate HTML & CSS.
   --------------------------------------------------------------------------
   Per halaman (index, proposal, admin, 404, blocked):
     1. Komentar HTML dihapus (peta section & anotasi source tidak bocor).
     2. CSS inline di-minify (whitespace + komentar terbuang).
     3. assets/css/tw.css di-minify ulang (strip komentar + kosong).
     4. Email & hex warna diobfuscate (entitas HTML) — anti grep skrip.
     5. Banner anti-clone disuntik sebagai komentar noise di posisi acak.
   Aman untuk SEO: <title>, meta description/og/canonical, heading, alt,
   teks konten, dan seluruh struktur semantik TIDAK diubah.
   Pakai:  node scripts/build-htmlcrypt.mjs
   ========================================================================== */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BANNER = 'Konten dilindungi - CV. TIMUR ABADI FIBER (c)2026 jpXCode - Pelanggaran hak cipta ditindak hukum.';

/* ── 1. Strip komentar HTML (pertahankan conditional comments bila ada) ── */
function stripComments(html) {
  return html.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
}

/* ── 2. Minify blok <style> inline ── */
function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .replace(/\s!important/g, '!important')
    .trim();
}
function minifyStyleBlocks(html) {
  return html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/gi, (_, attrs, css) => `<style${attrs}>${minifyCss(css)}</style>`);
}

/* ── 3. Minify tag & whitespace antar-elemen (SATU baris, tetap valid) ── */
function minifyMarkup(html) {
  return html
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n/g, '\n')
    .replace(/\s{2,}/g, ' ')
    .replace(/> </g, '><')
    .trim();
}

/* ── Segment-aware: <style>/<script> adalah RAW TEXT (entitas HTML tidak
   didecode di dalamnya) — semua transformasi berbasis entitas & injeksi
   banner HANYA boleh menyentuh markup, bukan raw text elements. ── */
function mapMarkup(html, fn) {
  return html
    .split(/(<style[^>]*>[\s\S]*?<\/style>|<script[^>]*>[\s\S]*?<\/script>)/gi)
    .map((seg, i) => (i % 2 === 1 ? seg : fn(seg)))
    .join('');
}

/* ── 4. Obfuscate email + hex warna (markup saja) ── */
function obfuscateStrings(html) {
  return html
    .replace(/([A-Za-z0-9._%+-])@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g, '$1&#64;$2')
    .replace(/#([0-9A-Fa-f]{6})\b/g, (m, hex) => '&#35;' + hex.split('').map(c => '&#x' + c.charCodeAt(0).toString(16) + ';').join(''));
}

/* ── 5. Suntik banner komentar noise (markup saja) ── */
function injectBanners(html) {
  const banner = `<!-- ${BANNER} -->`;
  let out = html;
  const mid = Math.floor(out.length * 0.45);
  const anchor = out.indexOf('><', mid);
  if (anchor > -1) out = out.slice(0, anchor + 2) + banner + out.slice(anchor + 2);
  return banner + '\n' + out;
}

const PAGES = ['index.html', 'proposal.html', join('admin', 'index.html'), '404.html', 'blocked.html'];
let ok = 0, fail = 0;
for (const rel of PAGES) {
  try {
    const p = join(ROOT, rel);
    let html = readFileSync(p, 'utf8');
    const before = html.length;
    html = stripComments(html);
    html = minifyStyleBlocks(html);
    html = minifyMarkup(html);
    html = mapMarkup(html, obfuscateStrings);
    html = mapMarkup(html, injectBanners);
    writeFileSync(p, html);
    ok++;
    console.log('CRYPT', rel, (before / 1024).toFixed(1) + 'KB ->', (html.length / 1024).toFixed(1) + 'KB');
  } catch (err) {
    console.error('FAIL', rel, err.message);
    fail++;
  }
}

/* ── tw.css: strip komentar + whitespace (cssnano-grade ringan) ── */
try {
  const cp = join(ROOT, 'assets', 'css', 'tw.css');
  const before = readFileSync(cp, 'utf8');
  const after = minifyCss(before);
  writeFileSync(cp, after);
  console.log('CRYPT assets/css/tw.css', (before.length / 1024).toFixed(1) + 'KB ->', (after.length / 1024).toFixed(1) + 'KB');
} catch (err) {
  console.error('FAIL tw.css', err.message);
  fail++;
}

console.log(`\nSelesai: ${ok} halaman, ${fail} gagal.`);
process.exit(fail ? 1 : 0);
