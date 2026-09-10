/**
 * Apply admin-schema.sql ke Supabase produksi TAF (idempotent).
 * Jalankan: node --env-file=.env supabase/apply-admin-schema.mjs
 *
 * .env harus memuat:
 *   VITE_SUPABASE_URL          (https://xxx.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY  (untuk sinkron adminProfiles)
 *   SUPABASE_DB_PASSWORD       (password database — Dashboard → Settings → Database)
 *
 * Eksekusi via koneksi Postgres langsung (pooler) — tanpa perlu RPC exec_sql.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Client } = require('pg');

const REF = String(process.env.VITE_SUPABASE_URL || '').trim().match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const PASSWORD = String(process.env.SUPABASE_DB_PASSWORD || '').trim();
const SB = String(process.env.VITE_SUPABASE_URL || '').trim().replace(/\/$/, '');
const SERVICE_KEY = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!REF) { console.error('❌ VITE_SUPABASE_URL tidak ditemukan di .env'); process.exit(1); }
if (!PASSWORD) {
  console.error('❌ SUPABASE_DB_PASSWORD belum ada di .env');
  console.error('   Ambil/reset di: Supabase Dashboard → Project Settings → Database → Database password');
  process.exit(1);
}

// ── 1. Cari koneksi pooler yang hidup (region acak menurut project) ─────────
const REGIONS = ['ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-south-1', 'us-east-1', 'us-west-1', 'eu-central-1', 'eu-west-1', 'eu-west-2', 'sa-east-1'];

function makeClient(host, port, user) {
  return new Client({
    host, port, user, password: PASSWORD, database: 'postgres',
    ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000,
  });
}

async function findConnection() {
  if (process.env.SUPABASE_DB_HOST) {
    return { host: process.env.SUPABASE_DB_HOST, port: +(process.env.SUPABASE_DB_PORT || 6543), user: process.env.SUPABASE_DB_USER || `postgres.${REF}` };
  }
  for (const region of REGIONS) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    for (const cfg of [
      { port: 6543, user: `postgres.${REF}` },
      { port: 5432, user: `postgres.${REF}` },
    ]) {
      const c = makeClient(host, cfg.port, cfg.user);
      try {
        await c.connect(); await c.end();
        console.log(`🔌 Koneksi OK → ${region} :${cfg.port}`);
        return { host, port: cfg.port, user: cfg.user };
      } catch { /* cek kandidat berikutnya */ }
    }
  }
  return null;
}

// ── 2. Split SQL sederhana (schema ini tanpa function/dollar-quote) ─────────
const sql = readFileSync(new URL('./admin-schema.sql', import.meta.url), 'utf8');
const stmts = sql
  .split(/;\s*\n/)
  .map(s => s.replace(/^(--[\s\S]*?--\n|\n|--[^\n]*\n)+/, '').trim())
  .filter(Boolean);

const conn = await findConnection();
if (!conn) { console.error('❌ Tidak menemukan koneksi pooler — cek SUPABASE_DB_PASSWORD / status project'); process.exit(1); }

const c = makeClient(conn.host, conn.port, conn.user);
await c.connect();
let ok = 0, gagal = 0;
for (const st of stmts) {
  try { await c.query(st); ok++; }
  catch (e) {
    // "already exists" dianggap sukses (idempotent)
    if (/already exists/i.test(e.message)) { ok++; continue; }
    gagal++;
    console.log('⚠️  GAGAL:', st.slice(0, 70).replace(/\n/g, ' '), '→', e.message);
  }
}
await c.end();
console.log(`📋 Schema: ${ok} ok, ${gagal} gagal.`);

// ── 3. Sinkron adminProfiles utk user admin (via service_role) ──────────────
if (SERVICE_KEY && gagal === 0) {
  try {
    const ADMIN_EMAIL = 'admin@timurabadi.com';
    const r = await fetch(`${SB}/auth/v1/admin/users?page=1&per_page=50`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const users = (await r.json()).users || [];
    const admin = users.find(u => u.email === ADMIN_EMAIL);
    if (admin) {
      const c2 = makeClient(conn.host, conn.port, conn.user);
      await c2.connect();
      await c2.query(
        `insert into "adminProfiles" (id, email, nama, role, aktif) values ($1,$2,$3,'ADMIN',true)
         on conflict (id) do update set email = excluded.email, aktif = true`,
        [admin.id, admin.email, 'Admin TAF']
      );
      await c2.end();
      console.log(`👤 adminProfiles OK → ${ADMIN_EMAIL} (${admin.id})`);
    } else {
      console.log(`⚠️  User ${ADMIN_EMAIL} belum ada di Auth — buat dulu, lalu jalankan ulang script ini.`);
    }
  } catch (e) { console.log('⚠️  Sinkron adminProfiles gagal:', e.message); }
}

console.log(gagal ? '❌ Selesai dengan gagal.' : '✅ Schema admin siap.');
process.exit(gagal ? 1 : 0);
