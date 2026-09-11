#!/usr/bin/env node
/* ==========================================================================
   BUILD OBFUSCATION — CV. TIMUR ABADI FIBER (c) jpXCode
   Pipeline anti-clone:
     1. Minify + mangle semua JS publik dengan javascript-obfuscator
        (self-defending + domain-lock: script mati jika di-copy ke domain lain)
     2. Tulis versi obfuscated ke file publik yang dilayani Vercel
     3. Sumber plaintext tinggal di assets/js/src/ (TIDAK ikut ter-deploy)
   Pakai:  node scripts/build-secure.mjs
   ========================================================================== */
import JavaScriptObfuscator from 'javascript-obfuscator';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets', 'js', 'src');
const OUT = join(ROOT, 'assets', 'js');

/* Domain-lock: produksi sekarang + domain resmi tujuan migrasi.
   Script berhenti total kalau file di-copy ke domain lain.
   TAF_QA=1 -> izinkan localhost untuk QA browser lokal (JANGAN dipakai produksi). */
const QA_MODE = process.env.TAF_QA === '1';
const DOMAIN_LOCK = 'pt-timur-abadi-fiber-production.vercel.app,www.timurabadi-fiber.com,timurabadi-fiber.com'
  + (QA_MODE ? ',localhost,127.0.0.1' : '');

const FILES = [
  'supabase-config.js',
  'site-live.js',
  'chat-widget.js',
  'schema-seo.js',
  'ga4-loader.js',
  'ui-main.js',
  'booking.js',
  'guard.js',
  'admin.js',
];

const options = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  identifierNamesGenerator: 'hexadecimal',
  renameGlobals: false,            /* aman untuk window.* contract */
  selfDefending: true,             /* mati kalau di-beautify */
  stringArray: true,
  stringArrayEncoding: ['rc4'],
  stringArrayThreshold: 1,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  splitStrings: true,
  splitStringsChunkLength: 6,
  transformObjectKeys: true,
  unicodeEscapeSequence: true,
  domainLock: DOMAIN_LOCK.split(','),
  domainLockRedirectUrl: 'about:blank',
  disableConsoleOutput: false,     /* debug tetap mungkin utk owner */
  numbersToExpressions: true,
  simplify: true,
};

let ok = 0, fail = 0;
for (const name of FILES) {
  try {
    const plain = readFileSync(join(SRC, name), 'utf8');
    if (!plain.trim()) { console.log('SKIP (kosong):', name); continue; }
    const res = JavaScriptObfuscator.obfuscate(plain, options).getObfuscatedCode();
    writeFileSync(join(OUT, name), res);
    console.log('OBFUSCATED', name, '->', (res.length / 1024).toFixed(1) + 'KB');
    ok++;
  } catch (err) {
    console.error('FAIL', name, err.message);
    fail++;
  }
}
console.log(`\nSelesai: ${ok} obfuscated, ${fail} gagal.`);
process.exit(fail ? 1 : 0);
