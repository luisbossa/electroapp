/* Configuración central. Se puede ajustar con variables de entorno o un archivo .env (ver .env.example). */
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const crypto = require('node:crypto');
const { version } = require('../../package.json');

const RAIZ = path.resolve(__dirname, '..', '..');

/**
 * En Vercel (serverless) el disco del proyecto es de solo lectura y temporal:
 * la base se crea en /tmp y se reinicia con los datos de demostración en cada arranque.
 */
const enVercel = Boolean(process.env.VERCEL);
const DIR_DATOS = process.env.DATA_DIR
  ? path.resolve(RAIZ, process.env.DATA_DIR)
  : enVercel ? path.join(os.tmpdir(), 'gestion-equipo-medico') : path.join(RAIZ, 'data');
fs.mkdirSync(DIR_DATOS, { recursive: true });

/**
 * Secreto que firma la cookie de sesión. Debe ser el mismo en todas las instancias:
 *  1. SESSION_SECRET (recomendado, obligatorio en producción real);
 *  2. en Vercel sin SESSION_SECRET: derivado del id del proyecto (aceptable solo para demostración);
 *  3. en local: se genera una vez y se guarda en data/.session-secret.
 */
function obtenerSecretoSesion() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (enVercel) {
    console.warn('! SESSION_SECRET no está definido en Vercel: se usa un secreto derivado. Defínalo en Settings → Environment Variables.');
    return crypto.createHash('sha256').update(`gem|${process.env.VERCEL_PROJECT_ID || ''}|${process.env.VERCEL_GIT_REPO_ID || ''}`).digest('hex');
  }
  const archivo = path.join(DIR_DATOS, '.session-secret');
  if (!fs.existsSync(archivo)) fs.writeFileSync(archivo, crypto.randomBytes(48).toString('hex'), { mode: 0o600 });
  return fs.readFileSync(archivo, 'utf8').trim();
}

module.exports = {
  raiz: RAIZ,
  version,
  enVercel,
  /** Modo demostración: los cambios no son permanentes (Vercel). Se avisa en la pantalla de ingreso. */
  modoDemo: enVercel || process.env.DEMO_MODE === 'true',
  produccion: process.env.NODE_ENV === 'production' || enVercel,
  puerto: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  /** Detrás de un proxy HTTPS (Vercel, IIS, Nginx): necesario para cookies seguras e IP real. */
  confiarProxy: enVercel || process.env.TRUST_PROXY === 'true',
  baseDatos: path.join(DIR_DATOS, process.env.DB_FILE || 'gestion.db'),
  sesion: {
    secreto: obtenerSecretoSesion(),
    duracionMs: (Number(process.env.SESSION_HOURS) || 10) * 60 * 60 * 1000,
  },
  adminInicial: {
    usuario: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  // Vercel limita el cuerpo de las peticiones a 4,5 MB; en servidor propio se permiten fotos más grandes.
  limiteJson: process.env.JSON_LIMIT || (enVercel ? '4mb' : '25mb'),
};
