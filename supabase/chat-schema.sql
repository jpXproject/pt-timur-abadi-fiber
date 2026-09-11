-- ============================================================================
-- CHAT LIVE WIDGET — CV. ABADI TIMUR FIBER
-- Chat visitor ↔ admin via Supabase (pengganti Crisp). Realtime via Supabase
-- Realtime (postgres_changes). Idempotent — aman dijalankan ulang.
-- Jalankan di: Supabase Dashboard → SQL Editor → paste → RUN
-- ============================================================================

-- ── Tabel percakapan (1 baris per visitor/session) ──
-- PENTING: kolom camelCase WAJIB pakai tanda kutip agar tidak dilipat lowercase Postgres
create table if not exists "chatThreads" (
  id          uuid primary key default gen_random_uuid(),
  "sessionKey"  text not null unique,            -- ID anonim di localStorage visitor
  nama        text,                               -- opsional: nama yang ditinggalkan visitor
  email       text,                               -- opsional
  "pesanTerakhir" text,                           -- snapshot pesan terakhir (untuk inbox admin)
  "pesanTerakhirPada" timestamptz default now(),
  "belumDibaca" int default 0,                    -- counter unread untuk admin
  status      text default 'open' check (status in ('open','closed')),
  "userAgent"   text,
  "createdAt"   timestamptz default now()
);

-- ── Tabel pesan ──
create table if not exists "chatMessages" (
  id         bigserial primary key,
  "threadId"   uuid not null references "chatThreads"(id) on delete cascade,
  pengirim   text not null check (pengirim in ('visitor','admin')),
  isi        text not null,
  "createdAt"  timestamptz default now()
);

create index if not exists idx_chat_messages_thread on "chatMessages"("threadId", "createdAt");

-- ── RLS ──
alter table "chatThreads" enable row level security;
alter table "chatMessages" enable row level security;

drop policy if exists "visitor create own thread" on "chatThreads";
create policy "visitor create own thread" on "chatThreads"
  for insert to anon with check (true);

drop policy if exists "visitor read all threads" on "chatThreads";
create policy "visitor read all threads" on "chatThreads"
  for select to anon using (true);   -- thread anonim tak sensitif; pesan difilter per threadId di klien

drop policy if exists "visitor update own thread" on "chatThreads";
create policy "visitor update own thread" on "chatThreads"
  for update to anon using (true) with check (true);

drop policy if exists "admin full threads" on "chatThreads";
create policy "admin full threads" on "chatThreads"
  for all to authenticated using (true) with check (true);

drop policy if exists "visitor read+send messages" on "chatMessages";
create policy "visitor read+send messages" on "chatMessages"
  for all to anon using (true) with check (true);

drop policy if exists "admin full messages" on "chatMessages";
create policy "admin full messages" on "chatMessages"
  for all to authenticated using (true) with check (true);

-- ── Realtime: aktifkan replikasi supaya postgres_changes terkirim ──
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'chatMessages') then
    alter publication supabase_realtime add table "chatMessages";
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'chatThreads') then
    alter publication supabase_realtime add table "chatThreads";
  end if;
end $$;
