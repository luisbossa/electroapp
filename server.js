/* Punto de entrada: prepara la base de datos y levanta el servidor HTTP.
   Uso: npm start   (desarrollo con recarga automática: npm run dev) */
const os = require('node:os');
const config = require('./src/config');
const { sembrar } = require('./src/database/semilla');
const { db } = require('./src/database/conexion');

console.log(`Base de datos: ${config.baseDatos}`);
sembrar();

const app = require('./src/app');

const servidor = app.listen(config.puerto, config.host, () => {
  console.log(`\nGestión de Equipo Médico v${config.version} en ejecución:`);
  console.log(`  · Este equipo:  http://localhost:${config.puerto}`);
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal);
  ips.forEach(i => console.log(`  · En la red:    http://${i.address}:${config.puerto}`));
  console.log('\nPresione Ctrl+C para detener.');
});

function cerrar(senal) {
  console.log(`\n${senal} recibido: cerrando servidor...`);
  servidor.close(() => { db.close(); process.exit(0); });
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', () => cerrar('SIGINT'));
process.on('SIGTERM', () => cerrar('SIGTERM'));
