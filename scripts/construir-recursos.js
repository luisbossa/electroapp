/* Copia las librerías del cliente desde node_modules a public/vendor para servirlas
   desde el mismo dominio (sin CDN externos). Se ejecuta con `npm run build`. */
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const destino = path.join(raiz, 'public', 'vendor');

const archivos = {
  'lucide.min.js': 'node_modules/lucide/dist/umd/lucide.min.js',
  'chart.umd.min.js': 'node_modules/chart.js/dist/chart.umd.js',
  'sweetalert2.all.min.js': 'node_modules/sweetalert2/dist/sweetalert2.all.min.js',
};

fs.mkdirSync(destino, { recursive: true });
for (const [nombre, origen] of Object.entries(archivos)) {
  fs.copyFileSync(path.join(raiz, origen), path.join(destino, nombre));
  console.log(`vendor/${nombre} <- ${origen}`);
}
