/* Respaldo manual de la base de datos (también sirve para el Programador de tareas de Windows).
   Uso:  npm run db:respaldar           crea un respaldo ahora
         npm run db:respaldar -- --lista  muestra los respaldos existentes */
const config = require('../src/config');
const { crearRespaldo, listarRespaldos } = require('../src/database/respaldo');

if (process.argv.includes('--lista')) {
  const respaldos = listarRespaldos();
  console.log(`Carpeta: ${config.respaldos.carpeta}`);
  if (!respaldos.length) console.log('No hay respaldos todavía.');
  for (const r of respaldos) console.log(`  ${r.fecha.toLocaleString('es-CR')}  ${(r.bytes / 1024 / 1024).toFixed(2).padStart(8)} MB  ${r.nombre}`);
} else {
  try {
    const r = crearRespaldo();
    console.log(`Respaldo creado: ${r.ruta} (${(r.bytes / 1024 / 1024).toFixed(2)} MB)`);
    if (r.borrados) console.log(`Se eliminaron ${r.borrados} respaldo(s) antiguo(s) (se conservan ${config.respaldos.conservar}).`);
  } catch (error) {
    console.error(`No se pudo crear el respaldo: ${error.message}`);
    process.exitCode = 1;
  }
}
