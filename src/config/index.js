/* Configuración central. Se puede ajustar con variables de entorno o un archivo .env (ver .env.example). */
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

const RAIZ = path.resolve(__dirname, '..', '..');
const DIR_DATOS = path.resolve(RAIZ, process.env.DATA_DIR || 'data');
fs.mkdirSync(DIR_DATOS, { recursive: true });

/** Secreto de sesión: usa SESSION_SECRET o genera uno y lo guarda en data/ para que sobreviva reinicios. */
function obtenerSecretoSesion() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  const archivo = path.join(DIR_DATOS, '.session-secret');
  if (!fs.existsSync(archivo)) fs.writeFileSync(archivo, crypto.randomBytes(48).toString('hex'), { mode: 0o600 });
  return fs.readFileSync(archivo, 'utf8').trim();
}

const produccion = process.env.NODE_ENV === 'production';

module.exports = {
  raiz: RAIZ,
  produccion,
  puerto: Number(process.env.PORT) || 3000,
  host: process.env.HOST || '0.0.0.0',
  /** Activar solo si la app está detrás de un proxy inverso (IIS, Nginx) con HTTPS. */
  confiarProxy: process.env.TRUST_PROXY === 'true',
  baseDatos: path.join(DIR_DATOS, process.env.DB_FILE || 'gestion.db'),
  sesion: {
    secreto: obtenerSecretoSesion(),
    duracionMs: (Number(process.env.SESSION_HOURS) || 10) * 60 * 60 * 1000,
  },
  adminInicial: {
    usuario: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  limiteJson: process.env.JSON_LIMIT || '25mb', // las fichas pueden incluir fotos en base64
  version: require(path.join(RAIZ, 'package.json')).version,
};
