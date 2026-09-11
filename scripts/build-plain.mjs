#!/usr/bin/env node
/* ==========================================================================
   BUILD COPY — sinkronkan sumber plaintext -> file publik TANPA obfuscation.
   Dipakai saat butuh debug cepat. Produksi SELALU pakai build-secure.mjs.
   Pakai:  node scripts/build-plain.mjs
   ========================================================================== */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets', 'js', 'src');
const OUT = join(ROOT, 'assets', 'js');

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

mkdirSync(OUT, { recursive: true });
for (const name of FILES) {
  try {
    writeFileSync(join(OUT, name), readFileSync(join(SRC, name), 'utf8'));
    console.log('PLAIN', name);
  } catch (err) {
    console.error('FAIL', name, err.message);
    process.exitCode = 1;
  }
}
