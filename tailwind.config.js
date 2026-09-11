/** @type {import('tailwindcss').Config} */
/* Config ekstrak dari tailwind.config inline di index.html — sumber kebenaran
   pindah ke file ini agar bisa di-build offline (tanpa CDN runtime). */
module.exports = {
  content: [
    './*.html',
    './assets/js/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        neuBg: '#F0FDF4',        /* Fresh Mint White — latar utama */
        neuDark: '#B9E0E8',      /* Cyan Tint Soft Shadow — bayangan neumorphic */
        ocean: '#0284C7',        /* Bright Cyan — navbar, judul, aksen utama */
        oceanDark: '#0369A1',
        turquoise: '#0E9F6E',    /* Splash Teal — ikon, badge, poin eco-friendly */
        sunset: '#FFC72C',
        waGreen: '#25D366',
        navyText: '#0B1B3D',
        ctaOrange: '#FF5A1F',    /* Neon Orange — tombol konversi utama */
        ctaOrangeDark: '#E8480F',
      },
      fontFamily: {
        heading: ['"Fredoka"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
