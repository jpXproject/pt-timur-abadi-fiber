/**
 * PT. TIMUR ABADI FIBER — JSON-LD Structured Data (SEO Grade A)
 * ============================================================
 * Data terstruktur membuat Google memahami entitas bisnis: nama, lokasi
 * (Tulungagung → Jawa Timur → nasional), layanan, kontak, jam operasional.
 *
 * Skema:
 *   1. Organization + LocalBusiness (ManufacturingCompany) — identitas utama
 *   2. WebSite — sitelinks searchbox-ready
 *   3. Service x6 — masing-masing layanan sebagai entitas
 *   4. FAQPage — jawaban langsung di hasil pencarian (rich result)
 */
// DOMAIN DUAL-MODE: preview pakai vercel.app, produksi otomatis pakai domain resmi
// saat website berjalan di www.timurabadi-fiber.com (migrasi tanpa edit kode)
const DOMAIN = location.hostname.includes('timurabadi-fiber.com')
  ? 'https://www.timurabadi-fiber.com'
  : 'https://timurabadi.com';

const ORG = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'LocalBusiness'],
  '@id': DOMAIN + '/#organization',
  name: 'PT. Timur Abadi Fiber',
  alternateName: ['Timur Abadi Fiber', 'TAF Tulungagung', 'Kontraktor Waterpark Timur Abadi'],
  description: 'Produsen & General Contractor wahana waterpark fiberglass (FRP) di Tulungagung, Jawa Timur. Melayani konstruksi waterpark, desain 3D, water slide, playground air, renovasi, maintenance & painting untuk klien di seluruh Indonesia — 25+ tahun pengalaman, 21+ klien skala nasional.',
  url: DOMAIN + '/',
  telephone: ['+62-812-3824-2926', '+62-813-5713-0170'],
  email: 'admin@timurabadi.com',
  foundingDate: '2001',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Jl. Kimangun Sarkoro 31D No. 18',
    addressLocality: 'Tulungagung',
    addressRegion: 'Jawa Timur',
    postalCode: '66211',
    addressCountry: 'ID',
  },
  geo: { '@type': 'GeoCoordinates', latitude: -8.0658, longitude: 111.9000 },
  areaServed: [
    { '@type': 'City', name: 'Tulungagung' },
    { '@type': 'City', name: 'Malang' },
    { '@type': 'City', name: 'Batu' },
    { '@type': 'AdministrativeArea', name: 'Jawa Timur' },
    { '@type': 'Country', name: 'Indonesia' },
  ],
  openingHoursSpecification: [{
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '08:00',
    closes: '16:00',
  }],
  contactPoint: [
    { '@type': 'ContactPoint', contactType: 'sales', telephone: '+62-812-3824-2926', availableLanguage: ['id', 'ID'] },
    { '@type': 'ContactPoint', contactType: 'technical support', telephone: '+62-813-5713-0170', availableLanguage: ['id', 'ID'] },
  ],
  sameAs: [],
  knowsAbout: ['Konstruksi Waterpark', 'Fiberglass FRP', 'Water Slide', 'Playground Air', 'General Contractor Waterpark'],
};

const WEBSITE = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': DOMAIN + '/#website',
  url: DOMAIN + '/',
  name: 'PT. Timur Abadi Fiber',
  publisher: { '@id': 'https://timurabadi.com/#organization' },
  inLanguage: 'id-ID',
};

const LAYANAN = [
  ['Konstruksi Waterpark — General Contractor', 'Konstruksi waterpark menyeluruh: pekerjaan sipil kolam, pembesian, plumbing hidrolik, mechanical-electrical, hingga fabrikasi & instalasi wahana fiberglass. Melayani seluruh Indonesia.'],
  ['Jasa Desain Waterpark 3D & Blueprint', 'Perencanaan masterplan waterpark, desain 3D wahana, blueprint teknis, dan RAB — oleh tenaga ahli bersertifikasi.'],
  ['Renovasi & Penambahan Wahana Waterpark', 'Renovasi waterpark lama, penambahan wahana seluncur baru, perbaikan struktur fiberglass & sistem sirkulasi air.'],
  ['Produsen Water Slide & Playground Air FRP', 'Produsen wahana seluncuran air (spiral, race, boomerang, body, capsule), ember tumpah, water castle & playground air fiberglass untuk anak-anak.'],
  ['Maintenance & Servis Berkala Waterpark', 'Kontrak perawatan berkala waterpark: inspeksi wahana, perbaikan gelcoat, servis pompa & sistem hidrolik.'],
  ['Painting Gelcoat & Kerajinan Fiberglass Custom', 'Pengecatan ulang gelcoat wahana air, pembuatan patung tematik, ornamen, sepeda air & kerajinan fiberglass custom.'],
].map(([nama, desk]) => ({
  '@type': 'Service',
  name: nama,
  description: desk,
  provider: { '@id': DOMAIN + '/#organization' },
  areaServed: { '@type': 'Country', name: 'Indonesia' },
}));

const FAQ = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Berapa pengalaman PT. Timur Abadi Fiber dalam konstruksi waterpark?',
      acceptedAnswer: { '@type': 'Answer', text: 'Berpengalaman 25+ tahun di industri fiberglass, dan sejak 2017 bergerak sebagai General Contractor Waterpark terpadu dengan 21+ klien skala nasional seperti Jatim Park, Hawai Waterpark Malang, dan Taman Safari Prigen.' },
    },
    {
      '@type': 'Question',
      name: 'Di mana lokasi pabrik & kantor PT. Timur Abadi Fiber?',
      acceptedAnswer: { '@type': 'Answer', text: 'Kantor dan pabrik kami berada di Jl. Kimangun Sarkoro 31D No. 18, Tulungagung, Jawa Timur. Kami melayani kontrak konstruksi waterpark ke seluruh Indonesia — dari Sumatera, Jawa, hingga Sulawesi.' },
    },
    {
      '@type': 'Question',
      name: 'Apakah melayani pembangunan waterpark di luar Jawa Timur?',
      acceptedAnswer: { '@type': 'Answer', text: 'Ya. Kami melayani proyek di seluruh Indonesia — termasuk Kuningan (Jawa Barat), Batam (Kepulauan Riau), Medan (Sumatera), Pangkal Pinang (Bangka), dan Sulawesi Utara. Tim teknisi kami yang datang ke lokasi.' },
    },
    {
      '@type': 'Question',
      name: 'Layanan apa saja yang tersedia?',
      acceptedAnswer: { '@type': 'Answer', text: 'Enam layanan utama: konstruksi waterpark (general contractor), desain 3D & blueprint, renovasi & penambahan wahana, produksi water slide & playground FRP, maintenance berkala, serta painting gelcoat & kerajinan fiberglass custom.' },
    },
    {
      '@type': 'Question',
      name: 'Bagaimana cara meminta konsultasi atau survei lokasi?',
      acceptedAnswer: { '@type': 'Answer', text: 'Isi formulir booking di website ini, atau hubungi WhatsApp resmi kami di +62 812-3824-2926 (fast respon) / +62 813-5713-0170 (konsultasi teknis). Tim kami merespon dalam 1x24 jam pada jam layanan 08:00-16:00 WIB.' },
    },
  ],
};

const GRAPH = {
  '@context': 'https://schema.org',
  '@graph': [ORG, WEBSITE, ...LAYANAN, FAQ],
};

const el = document.createElement('script');
el.type = 'application/ld+json';
el.id = 'taf-jsonld';
el.textContent = JSON.stringify(GRAPH, null, 1);
document.head.appendChild(el);
console.log('[SEO] JSON-LD terpasang: Organization + LocalBusiness + WebSite + 6 Service + FAQPage');
