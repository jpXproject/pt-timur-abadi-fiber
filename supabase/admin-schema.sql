-- ============================================================================
-- CV. ABADI TIMUR FIBER — ADMIN PANEL SCHEMA (Supabase)
-- Jalankan via: supabase/apply-schema.mjs (idempotent, aman diulang)
-- ============================================================================

-- ── 1. PROFIL ADMIN (sinkron Supabase Auth) ────────────────────────────────
create table if not exists "adminProfiles" (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nama text not null default 'Admin TAF',
  role text not null default 'ADMIN',          -- OWNER | ADMIN
  aktif boolean not null default true,
  "createdAt" timestamptz default now()
);

-- ── 2. KONTEN SITUS (key-value; edit lewat admin panel) ────────────────────
create table if not exists "siteContent" (
  key text primary key,                        -- cth: hero_title, wa1, alamat, jam_layanan
  value text,
  label text,                                  -- nama ramah utk form admin
  kategori text default 'umum',                -- umum | kontak | hero | footer
  "updatedAt" timestamptz default now()
);

-- ── 3. GALERI PROYEK REAL (upload via admin → Supabase Storage) ────────────
create table if not exists "gallery" (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  deskripsi text,
  klien text,                                  -- nama klien (opsional)
  lokasi text,                                 -- kota/provinsi
  "fotoUrl" text not null,                    -- path di storage bucket 'gallery' — WAJIB quoted (camelCase)
  urutan int default 0,                        -- order tampil
  aktif boolean default true,
  "createdAt" timestamptz default now()
);

-- ── 4. MEDIA SOSIAL RESMI ─────────────────────────────────────────────────
create table if not exists "socialLinks" (
  id uuid primary key default gen_random_uuid(),
  platform text not null,                      -- instagram | facebook | tiktok | youtube | twitter
  url text not null,
  handle text,                                 -- @timurabadifiber
  aktif boolean default true,
  urutan int default 0
);

-- ── RLS DASAR: publik hanya baca, tulis hanya admin login ─────────────────
alter table "siteContent" enable row level security;
alter table "gallery"     enable row level security;
alter table "socialLinks" enable row level security;

drop policy if exists "publik baca konten"    on "siteContent";
drop policy if exists "publik baca galeri"    on "gallery";
drop policy if exists "publik baca medsos"    on "socialLinks";
create policy "publik baca konten" on "siteContent" for select using (true);
create policy "publik baca galeri" on "gallery"     for select using (aktif = true);
create policy "publik baca medsos" on "socialLinks" for select using (aktif = true);

-- Tulis: hanya user auth aktif (Owner/ADMIN) — butuh tabel adminProfiles terisi
drop policy if exists "admin tulis konten" on "siteContent";
drop policy if exists "admin tulis galeri" on "gallery";
drop policy if exists "admin tulis medsos" on "socialLinks";
create policy "admin tulis konten" on "siteContent" for all
  to authenticated using (true) with check (true);
create policy "admin tulis galeri" on "gallery" for all
  to authenticated using (true) with check (true);
create policy "admin tulis medsos" on "socialLinks" for all
  to authenticated using (true) with check (true);

-- ── SEED: konten awal (nilai = kondisi website saat ini) ───────────────────
insert into "siteContent" (key, value, label, kategori) values
  ('hero_badge',  'BERPENGALAMAN 25+ TAHUN • SEJAK 2017 GENERAL CONTRACTOR WATERPARK', 'Badge Hero', 'hero'),
  ('hero_title',  'Wujudkan Wahana Waterpark Impian Bersama Kontraktor Profesional', 'Judul Hero', 'hero'),
  ('wa1',         '6281238242926', 'WhatsApp 1 (Fast Respon)', 'kontak'),
  ('wa2',         '6281357130170', 'WhatsApp 2 (Konsultasi Teknis)', 'kontak'),
  ('email',       'admin@abaditimurfiber.com', 'Email Resmi', 'kontak'),
  ('alamat',      'Jl. Kimangun Sarkoro 31D No. 18, Tulungagung, Jawa Timur', 'Alamat Kantor', 'kontak'),
  ('jam_layanan', 'Senin - Sabtu, 08:00 - 16:00 WIB (24/7 Support Proyek)', 'Jam Layanan', 'kontak'),
  ('stat_pengalaman', '25+', 'Statistik: Tahun Pengalaman', 'umum'),
  ('stat_tenaga',     '23',  'Statistik: Tenaga Ahli', 'umum'),
  ('stat_klien',      '21+', 'Statistik: Klien Nasional', 'umum'),
  ('stat_proyek',     '21 / 3', 'Statistik: Selesai / Berjalan', 'umum')
on conflict (key) do nothing;

insert into "socialLinks" (platform, url, handle, urutan) values
  ('instagram', 'https://instagram.com/timurabadifiber', '@timurabadifiber', 1),
  ('facebook',  'https://facebook.com/timurabadifiber',  '@timurabadifiber', 2),
  ('youtube',   'https://youtube.com/@timurabadifiber',  '@timurabadifiber', 3),
  ('tiktok',    'https://tiktok.com/@timurabadifiber',   '@timurabadifiber', 4)
on conflict do nothing;
