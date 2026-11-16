/* Respaldos de la base SQLite.
   - Usa `VACUUM INTO`: copia coherente y compacta, sin detener el servidor ni bloquear a los usuarios.
   - Cada copia se verifica (PRAGMA quick_check) antes de darla por buena.
   - Se conservan las últimas N copias (BACKUP_KEEP); las más antiguas se borran.
   Configuración en .env / web.config: BACKUP_INTERVAL_HOURS, BACKUP_KEEP, BACKUP_DIR. */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');
const { db } = require('./conexion');

const PREFIJO = path.parse(config.baseDatos).name; // "gestion"
const PATRON = new RegExp(`^${PREFIJO}_\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}-\\d{2}\\.db$`);

function marcaDeTiempo(fecha = new Date()) {
  const d = (n) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${d(fecha.getMonth() + 1)}-${d(fecha.getDate())}_${d(fecha.getHours())}-${d(fecha.getMinutes())}-${d(fecha.getSeconds())}`;
}

/** Respaldos existentes, del más reciente al más antiguo. */
function listarRespaldos() {
  const { carpeta } = config.respaldos;
  if (!fs.existsSync(carpeta)) return [];
  return fs.readdirSync(carpeta)
    .filter((nombre) => PATRON.test(nombre))
    .map((nombre) => {
      const ruta = path.join(carpeta, nombre);
      const { mtimeMs, size } = fs.statSync(ruta);
      return { nombre, ruta, fecha: new Date(mtimeMs), bytes: size };
    })
    .sort((a, b) => b.nombre.localeCompare(a.nombre)); // el nombre lleva la fecha: más reciente primero
}

/** Borra los respaldos que exceden la cantidad a conservar. */
function depurarRespaldos() {
  const sobrantes = listarRespaldos().slice(config.respaldos.conservar);
  for (const r of sobrantes) fs.rmSync(r.ruta, { force: true });
  return sobrantes.length;
}

/** Crea un respaldo verificado y devuelve su información. Lanza error si falla. */
function crearRespaldo() {
  const { carpeta } = config.respaldos;
  fs.mkdirSync(carpeta, { recursive: true });

  // Si ya hay un respaldo con la misma marca (dos en el mismo segundo), espera al siguiente segundo.
  let fecha = new Date();
  while (fs.existsSync(path.join(carpeta, `${PREFIJO}_${marcaDeTiempo(fecha)}.db`))) fecha = new Date(fecha.getTime() + 1000);
  const destino = path.join(carpeta, `${PREFIJO}_${marcaDeTiempo(fecha)}.db`);
  const temporal = `${destino}.tmp`; // no cuenta como respaldo hasta que esté completo y verificado
  fs.rmSync(temporal, { force: true });

  try {
    db.prepare('VACUUM INTO ?').run(temporal);

    const copia = new DatabaseSync(temporal, { readOnly: true });
    let estado;
    try { estado = copia.prepare('PRAGMA quick_check').get(); } finally { copia.close(); }
    const resultado = Object.values(estado || {})[0];
    if (resultado !== 'ok') throw new Error(`la copia no pasó la verificación de integridad (${resultado})`);

    fs.renameSync(temporal, destino);
  } catch (error) {
    fs.rmSync(temporal, { force: true });
    throw error;
  }

  const borrados = depurarRespaldos();
  return { ruta: destino, bytes: fs.statSync(destino).size, borrados };
}

/** Ejecuta un respaldo registrando el resultado en la consola (nunca detiene el servidor). */
function respaldarConRegistro(motivo) {
  try {
    const r = crearRespaldo();
    const mb = (r.bytes / 1024 / 1024).toFixed(2);
    console.log(`[respaldo] ${new Date().toLocaleString('es-CR')} · ${motivo}: ${r.ruta} (${mb} MB)${r.borrados ? ` · ${r.borrados} antiguo(s) eliminado(s)` : ''}`);
  } catch (error) {
    console.error(`[respaldo] ERROR (${motivo}): ${error.message}`);
  }
}

/**
 * Programa respaldos automáticos cada BACKUP_INTERVAL_HOURS horas.
 * Al iniciar, si el último respaldo es más viejo que el intervalo (o no hay ninguno),
 * respalda de inmediato: así un reinicio del servidor o de IIS no hace perder el ciclo.
 */
function iniciarRespaldosAutomaticos() {
  const { intervaloHoras, carpeta, conservar } = config.respaldos;
  if (config.enVercel || !(intervaloHoras > 0)) {
    console.log('[respaldo] Respaldos automáticos desactivados.');
    return;
  }
  const intervaloMs = intervaloHoras * 60 * 60 * 1000;
  console.log(`[respaldo] Automático cada ${intervaloHoras} h · se conservan ${conservar} · carpeta: ${carpeta}`);

  const ultimo = listarRespaldos()[0];
  const transcurrido = ultimo ? Date.now() - ultimo.fecha.getTime() : Infinity;
  const primeraEspera = Math.max(0, Math.min(intervaloMs - transcurrido, intervaloMs));

  setTimeout(() => {
    respaldarConRegistro(ultimo ? 'programado' : 'primer respaldo');
    setInterval(() => respaldarConRegistro('programado'), intervaloMs).unref();
  }, primeraEspera).unref();
}

module.exports = { crearRespaldo, listarRespaldos, depurarRespaldos, iniciarRespaldosAutomaticos };
