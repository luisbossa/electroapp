/** Configuración de Tailwind: se compila a public/css/tailwind.css con `npm run build`. */
module.exports = {
  content: [
    './src/**/*.{ejs,js}',
    './public/js/**/*.js',
    './api/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        brand: { dark: '#0F172A', blue: '#2563EB', bg: '#F8FAFC' },
      },
    },
  },
  plugins: [],
};
