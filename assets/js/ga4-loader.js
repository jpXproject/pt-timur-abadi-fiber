/**
 * GA4 (Google Analytics 4) loader — dual-mode
 * ============================================================
 * Isi window.GA4_MEASUREMENT_ID di index.html (format G-XXXXXXXXXX)
 * → tracking aktif otomatis (page_view + event form booking).
 * Kosong → script no-op: TIDAK ada request ke googletagmanager,
 * aman untuk PageSpeed & privasi sebelum ID dibuat.
 *
 * Cara isi: Admin Crisp inbox? Bukan — buka dashboard Google Analytics
 * → Admin → Data Streams → Web → Measurement ID → salin ke index.html.
 */
(function () {
  var ID = window.GA4_MEASUREMENT_ID;
  if (!ID || !/^G-[A-Z0-9]{8,12}$/.test(ID)) return; // no-op tanpa ID valid
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ID, { anonymize_ip: true });

  /* Event konversi: form booking dikirim (dipanggil dari index.html) */
  window.trackBookingSubmit = function (layanan) {
    try { gtag('event', 'generate_lead', { form: 'booking', layanan: layanan || '-' }); } catch (e) {}
  };
})();
