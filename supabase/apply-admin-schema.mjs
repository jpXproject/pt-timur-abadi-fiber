/**
 * Apply admin-schema.sql ke Supabase produksi (idempotent).
 * Jalankan: node --env-file=../../.env supabase/apply-admin-schema.mjs
 * .env harus memuat: VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { loadEnv } from '../../../juragan-ikan-v2/notify/lib/env.mjs';

loadEnv();
const URL = process.env.VITE_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('❌ .env belum memuat VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const sql = readFileSync(new URL('./admin-schema.sql', import.meta.url), 'utf8');
// Eksekusi per-statement (split sederhana di ';' tingkat atas — skema ini tanpa function body)
const stmts = sql.split(/;\s*\n/).map(s => s.trim()).filter(s => s && !s.startsWith('--'));
let ok = 0, gagal = 0;
for (const st of stmts) {
  const q = st.replace(/^(--[^\n]*\n)+/, ''); // buang komentar header tiap blok
  const { error } = await sb.rpc('exec_sql', { query: q }).catch(() => ({ error: { message: 'no rpc' } }));
  if (!error) { ok++; continue; }
  // Fallback: eksekusi via endpoint PostgREST tidak ada → gunakan exec langsung sb.rpc alternatif
  const { error: e2 } = await sb.rpc('exec', { sql: q }).catch(() => ({ error: e2 || { message: 'no rpc exec' } }));
  if (!e2) { ok++; continue; }
  gagal++;
  console.log('⚠️  GAGAL:', q.slice(0, 70).replace(/\n/g, ' '), '→', (error || e2).message);
}
console.log(`Selesai: ${ok} ok, ${gagal} gagal.`);
process.exit(gagal ? 1 : 0);
