/**
 * ============================================================================
 * CHAT LIVE WIDGET — CV. TIMUR ABADI FIBER (self-hosted, pengganti Crisp)
 * ============================================================================
 * - Bubble kanan bawah → jendela chat neumorphic senada desain situs
 * - Pesan tersimpan di Supabase (chatThreads/chatMessages), REALTIME:
 *   balasan admin muncul otomatis tanpa refresh
 * - Identitas visitor: sessionKey acak di localStorage (tanpa login)
 * - Admin membaca & membalas dari Admin Panel → tab Chat
 * Dependensi: supabase-config.js (window.SUPABASE_URL / SUPABASE_ANON), supabase-js v2
 * ============================================================================
 */
(function () {
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON || !window.supabase) return;

  /* ── Identitas visitor anonim ── */
  var SK = 'tafChatSession';
  var sessionKey = localStorage.getItem(SK);
  if (!sessionKey) {
    sessionKey = 'v-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem(SK, sessionKey);
  }

  var client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON);
  var thread = null;          // baris chatThreads milik visitor
  var channel = null;         // realtime subscription
  var terbuka = false;
  var belumDibaca = 0;

  /* ── Bangun UI ── */
  var CSS = [
    '#tafChat *{box-sizing:border-box;margin:0;padding:0;font-family:inherit}',
    '#tafBubble{position:fixed;bottom:1.25rem;right:1.25rem;z-index:2147483000;width:56px;height:56px;border-radius:18px;',
      'border:none;cursor:pointer;background:linear-gradient(145deg,#0284C7,#0369A1);box-shadow:6px 6px 14px rgba(23,72,115,.30),-4px -4px 10px #fff;',
      'display:flex;align-items:center;justify-content:center;transition:transform .2s ease,box-shadow .2s ease}',
    '#tafBubble:hover{transform:translateY(-2px)}',
    '#tafBubble svg{width:26px;height:26px;fill:#fff}',
    '#tafBadge{position:absolute;top:-5px;right:-5px;min-width:20px;height:20px;border-radius:99px;background:#FF5A1F;color:#fff;',
      'font:800 11px/20px "Plus Jakarta Sans",sans-serif;text-align:center;padding:0 5px;display:none}',
    '#tafWin{position:fixed;bottom:5.5rem;right:1.25rem;z-index:2147483000;width:min(92vw,360px);height:min(70vh,520px);',
      'border-radius:24px;background:#F0FDF4;box-shadow:12px 12px 28px rgba(23,72,115,.28),-8px -8px 20px #fff;',
      'display:none;flex-direction:column;overflow:hidden}',
    '#tafWin.buka{display:flex}',
    '.taf-head{background:linear-gradient(145deg,#0284C7,#0369A1);color:#fff;padding:14px 18px;display:flex;align-items:center;gap:10px}',
    '.taf-head .dot{width:9px;height:9px;border-radius:99px;background:#4ADE80;box-shadow:0 0 0 3px rgba(74,222,128,.25)}',
    '.taf-head b{font:700 14px "Fredoka",sans-serif;letter-spacing:.3px}',
    '.taf-head small{display:block;font:500 10.5px "Plus Jakarta Sans",sans-serif;opacity:.85}',
    '.taf-head button{margin-left:auto;background:rgba(255,255,255,.15);border:none;color:#fff;width:28px;height:28px;',
      'border-radius:10px;cursor:pointer;font-size:15px;line-height:1}',
    '.taf-body{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#F0FDF4}',
    '.taf-msg{max-width:82%;padding:9px 13px;border-radius:16px;font:500 13px/1.5 "Plus Jakarta Sans",sans-serif;',
      'white-space:pre-wrap;word-break:break-word}',
    '.taf-msg.visitor{align-self:flex-end;background:linear-gradient(145deg,#0284C7,#0369A1);color:#fff;',
      'border-bottom-right-radius:5px;box-shadow:3px 3px 8px rgba(23,72,115,.22)}',
    '.taf-msg.admin{align-self:flex-start;background:#fff;color:#0B1B3D;border-bottom-left-radius:5px;',
      'box-shadow:4px 4px 9px rgba(23,72,115,.14),-3px -3px 7px #fff}',
    '.taf-msg time{display:block;font-size:9.5px;opacity:.6;margin-top:3px}',
    '.taf-sapa{align-self:center;background:#fff;box-shadow:inset 3px 3px 6px #D9EFE6,inset -3px -3px 6px #fff;',
      'border-radius:14px;padding:10px 14px;font:600 12px "Plus Jakarta Sans",sans-serif;color:#0369A1;text-align:center}',
    '.taf-form{display:flex;gap:8px;padding:12px;border-top:1px solid #D5EEE2;background:#F0FDF4}',
    '.taf-form input{flex:1;border:none;outline:none;border-radius:13px;padding:11px 14px;font:500 13px "Plus Jakarta Sans",sans-serif;',
      'background:#F0FDF4;color:#0B1B3D;box-shadow:inset 4px 4px 8px #CFE7EE,inset -4px -4px 8px #fff}',
    '.taf-form button{border:none;cursor:pointer;border-radius:13px;padding:0 16px;background:linear-gradient(145deg,#FF5A1F,#E8480F);',
      'box-shadow:4px 4px 9px rgba(255,90,31,.35),-3px -3px 7px #fff;display:flex;align-items:center}',
    '.taf-form button svg{width:17px;height:17px;fill:#fff}',
    '@media (max-width:640px){#tafWin{bottom:5rem}}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.id = 'tafChat';
  root.innerHTML =
    '<button id="tafBubble" aria-label="Buka chat">' +
      '<svg viewBox="0 0 24 24"><path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z"/></svg>' +
      '<span id="tafBadge">1</span>' +
    '</button>' +
    '<div id="tafWin" role="dialog" aria-label="Chat CV. Timur Abadi Fiber">' +
      '<div class="taf-head"><span class="dot"></span><div><b>TIMUR ABADI FIBER</b><small>Biasanya membalas dalam beberapa menit</small></div><button id="tafClose" aria-label="Tutup chat">✕</button></div>' +
      '<div class="taf-body" id="tafBody"></div>' +
      '<form class="taf-form" id="tafForm">' +
        '<input id="tafInput" type="text" placeholder="Tulis pesan…" maxlength="800" autocomplete="off"/>' +
        '<button type="submit" aria-label="Kirim"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>' +
      '</form>' +
    '</div>';
  document.body.appendChild(root);

  var $ = function (id) { return document.getElementById(id); };
  var bubble = $('tafBubble'), win = $('tafWin'), body = $('tafBody'),
      form = $('tafForm'), input = $('tafInput'), badge = $('tafBadge');

  /* ── Helper ── */
  function jam(iso) {
    var d = iso ? new Date(iso) : new Date();
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  function render(msg) {
    var el = document.createElement('div');
    el.className = 'taf-msg ' + (msg.pengirim === 'visitor' ? 'visitor' : 'admin');
    el.innerHTML = esc(msg.isi) + '<time>' + jam(msg.createdAt) + '</time>';
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function sambutan() {
    var el = document.createElement('div');
    el.className = 'taf-sapa';
    el.textContent = '👋 Halo! Ada yang bisa kami bantu seputar konstruksi waterpark?';
    body.appendChild(el);
  }

  function updateBadge() {
    if (terbuka || belumDibaca <= 0) { badge.style.display = 'none'; return; }
    badge.textContent = belumDibaca > 9 ? '9+' : belumDibaca;
    badge.style.display = 'block';
  }

  /* ── Thread & pesan ── */
  async function pastikanThread() {
    if (thread) return thread;
    var r = await client.from('chatThreads')
      .select('*').eq('sessionKey', sessionKey).maybeSingle();
    if (r.data) { thread = r.data; return thread; }
    var buat = await client.from('chatThreads').insert({
      sessionKey: sessionKey,
      userAgent: navigator.userAgent.slice(0, 180)
    }).select().single();
    thread = buat.data;
    return thread;
  }

  async function muatPesan() {
    var t = await pastikanThread();
    if (!t) return;
    var r = await client.from('chatMessages')
      .select('*').eq('threadId', t.id).order('createdAt', { ascending: true }).limit(200);
    body.innerHTML = '';
    if (!r.data || !r.data.length) { sambutan(); return; }
    r.data.forEach(render);
  }

  async function kirim(isi) {
    isi = isi.trim();
    if (!isi) return;
    render({ pengirim: 'visitor', isi: isi, createdAt: new Date().toISOString() });
    var t = await pastikanThread();
    if (!t) return;
    await client.from('chatMessages').insert({ threadId: t.id, pengirim: 'visitor', isi: isi });
    await client.from('chatThreads').update({
      pesanTerakhir: isi.slice(0, 140),
      pesanTerakhirPada: new Date().toISOString(),
      belumDibaca: (t.belumDibaca || 0) + 1
    }).eq('id', t.id);
  }

  /* ── Realtime: balasan admin muncul otomatis ── */
  function langganan() {
    if (!thread || channel) return;
    channel = client.channel('taf-chat-' + thread.id);
    channel.on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'chatMessages',
      filter: 'threadId=eq.' + thread.id
    }, function (payload) {
      var m = payload.new;
      if (m.pengirim === 'admin') {
        render(m);
        if (!terbuka) { belumDibaca++; updateBadge(); }
      }
    }).subscribe();
  }

  /* ── Event ── */
  bubble.addEventListener('click', async function () {
    terbuka = !terbuka;
    win.classList.toggle('buka', terbuka);
    if (terbuka) {
      belumDibaca = 0; updateBadge();
      if (!body.children.length) { await muatPesan(); }
      langganan();
      input.focus();
    }
  });
  $('tafClose').addEventListener('click', function () {
    terbuka = false; win.classList.remove('buka');
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    kirim(input.value);
    input.value = '';
  });

  /* Pra-ambil thread di background agar langganan realtime siap lebih awal */
  pastikanThread().then(function (t) { if (t && !terbuka) muatPesan(); });
})();
