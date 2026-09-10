/* ============================================================================
 * PT. TIMUR ABADI FIBER — LIVE CONTENT BRIDGE (public site ← Supabase)
 * ============================================================================
 * Menghubungkan website publik dengan Admin Panel (/admin):
 *   1. Galeri Proyek  — tabel `gallery` → section #galeri (placeholder otomatis
 *      jika belum ada foto: klien tinggal upload lewat admin, tanpa sentuh kode)
 *   2. Media Sosial   — tabel `socialLinks` → ikon otomatis di footer
 *   3. Konten Hero    — tabel `siteContent` (hero_badge/hero_title) → hero live
 *
 * Desain aman:
 *   - Kredensial anon Supabase boleh publik (RLS: publik hanya SELECT data
 *     aktif — tulis hanya untuk admin terautentikasi).
 *   - Konfigurasi disimpan di localStorage saat admin mengisinya di /admin
 *     (sinkron otomatis, tanpa hardcode di 2 tempat).
 *   - Jika Supabase belum dikonfigurasi / gagal / kosong → website tampil
 *     normal dengan placeholder rapi (tidak pernah break).
 * ========================================================================== */
(function () {
  'use strict';

  var SB_URL  = window.SUPABASE_URL  || localStorage.getItem('tafSbUrl')  || '';
  var SB_ANON = window.SUPABASE_ANON || localStorage.getItem('tafSbAnon') || '';
  // Tanpa konfigurasi → langsung tampilkan galeri placeholder, selesai.
  if (!SB_URL || !SB_ANON || typeof supabase === 'undefined') {
    document.addEventListener('DOMContentLoaded', renderFallbackGallery);
    return;
  }
  var sb = supabase.createClient(SB_URL, SB_ANON);

  /* ── 1. GALERI PROYEK ──────────────────────────────────────────────────── */
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function galeriCard(g) {
    var img = g.fotoUrl
      ? '<img src="' + esc(g.fotoUrl) + '" alt="Proyek ' + esc(g.judul) +
        (g.lokasi ? ' — ' + esc(g.lokasi) : '') + ' | PT. Timur Abadi Fiber" loading="lazy" class="w-full h-full object-cover" onerror="this.remove()"/>'
      : '';
    var initials = esc((g.judul || 'P').split(/\s+/).slice(0, 2).map(function (w) { return w[0] || ''; }).join('').toUpperCase());
    var badge = g.klien
      ? '<span class="absolute top-3 left-3 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#0055A5] shadow">' + esc(g.klien) + '</span>'
      : '';
    return (
      '<div class="neu-flat overflow-hidden rounded-2xl group">' +
        '<div class="h-48 bg-gradient-to-br from-sky-400 via-cyan-500 to-[#0055A5] relative flex items-center justify-center">' +
          (img || '<span class="font-fredoka text-5xl text-white/80">' + initials + '</span>') + badge +
        '</div>' +
        '<div class="p-4">' +
          '<h3 class="font-fredoka text-sm font-bold text-navyText leading-snug">' + esc(g.judul) + '</h3>' +
          (g.lokasi ? '<p class="text-[11px] text-slate-500 font-semibold mt-1">📍 ' + esc(g.lokasi) + '</p>' : '') +
        '</div>' +
      '</div>'
    );
  }

  function renderFallbackGallery() {
    var grid = document.getElementById('galeriGrid');
    if (!grid) return;
    grid.innerHTML =
      '<div class="neu-flat p-8 md:col-span-2 lg:col-span-4 text-center rounded-2xl">' +
        '<p class="font-fredoka text-lg font-bold text-navyText">Dokumentasi Proyek Segera Hadir</p>' +
        '<p class="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">Galeri foto real proyek waterpark kami sedang dalam proses kurasi. ' +
        'Ingin melihat portofolio lengkap lebih awal? <a class="text-ocean font-bold hover:underline" href="#booking">Hubungi tim kami →</a></p>' +
      '</div>';
  }

  async function muatGaleri() {
    var grid = document.getElementById('galeriGrid');
    if (!grid) return;
    try {
      var res = await sb.from('gallery').select('judul,klien,lokasi,fotoUrl').eq('aktif', true).order('urutan').limit(24);
      if (res.error || !res.data || res.data.length === 0) { renderFallbackGallery(); return; }
      grid.innerHTML = res.data.map(galeriCard).join('');
    } catch (e) { renderFallbackGallery(); }
  }

  /* ── 2. MEDIA SOSIAL (footer) ──────────────────────────────────────────── */
  var ICONS = {
    instagram: '<path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 3.1a6.7 6.7 0 100 13.4 6.7 6.7 0 000-13.4zm0 11a4.3 4.3 0 110-8.6 4.3 4.3 0 010 8.6zm8.5-11.3a1.6 1.6 0 11-3.2 0 1.6 1.6 0 013.2 0z"/>',
    facebook:  '<path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/>',
    tiktok:    '<path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>',
    youtube:   '<path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/>',
    twitter:   '<path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41z"/>'
  };

  async function muatMedsos() {
    var wrap = document.getElementById('socialLinks');
    if (!wrap) return;
    try {
      var res = await sb.from('socialLinks').select('platform,url,handle').eq('aktif', true).order('urutan').limit(8);
      if (res.error || !res.data || res.data.length === 0) return;
      var valid = res.data.filter(function (m) { return ICONS[m.platform] && /^https?:\/\//.test(m.url); });
      var html = valid.map(function (m) {
        return '<a aria-label="' + esc(m.platform) + ' resmi PT. Timur Abadi Fiber" class="w-10 h-10 neu-pressed rounded-xl flex items-center justify-center text-slate-500 hover:text-ocean transition" href="' + esc(m.url) + '" rel="noopener" target="_blank">' +
          '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">' + ICONS[m.platform] + '</svg></a>';
      }).join('');
      if (html) wrap.innerHTML = html;
      if (valid.length) perkayaSchema(valid.map(function (m) { return m.url; }));
    } catch (e) { /* diam: footer tampil tanpa medsos */ }
  }

  /* SEO: setarakan medsos resmi ke schema Organization.sameAs (entity signal) */
  function perkayaSchema(urls) {
    var DOMAIN = location.hostname.includes('timurabadi-fiber.com')
      ? 'https://www.timurabadi-fiber.com' : 'https://timurabadi.com';
    document.querySelectorAll('script[type="application/ld+json"]').forEach(function (s) {
      try {
        var data = JSON.parse(s.textContent);
        (Array.isArray(data) ? data : [data]).forEach(function (node) {
          if (node && node['@id'] === DOMAIN + '/#organization' && Array.isArray(node.sameAs)) {
            node.sameAs = urls;
            s.textContent = JSON.stringify(node);
          }
        });
      } catch (e) { /* skip script JSON-LD lain */ }
    });
  }

  /* ── 3. KONTEN HERO LIVE ───────────────────────────────────────────────── */
  function setText(sel, val) {
    if (!val) return;
    var el = document.querySelector(sel);
    if (el) el.textContent = val;
  }

  async function muatKonten() {
    try {
      var res = await sb.from('siteContent').select('key,value');
      if (res.error || !res.data) return;
      var map = {};
      res.data.forEach(function (k) { map[k.key] = k.value; });
      setText('[data-live="hero_badge"]', map.hero_badge);
      setText('[data-live="hero_title"]', map.hero_title);
    } catch (e) { /* fallback: konten statis HTML tetap tampil */ }
  }

  document.addEventListener('DOMContentLoaded', function () {
    muatGaleri(); muatMedsos(); muatKonten();
  });
})();
