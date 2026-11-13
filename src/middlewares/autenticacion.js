/* Middlewares de autenticación, autorización y protección de la API. */
const Usuario = require('../models/usuario.model');

const INVITADO = Object.freeze({ id: 'guest-public-access', nombre: 'Invitado', usuario: 'invitado', rol: 'invitado', activo: true });

/**
 * Carga el usuario de la sesión en req.usuario. Para cuentas reales se vuelve a consultar
 * la base de datos, así un usuario desactivado o con rol cambiado pierde el acceso al instante.
 */
function cargarUsuario(req, _res, next) {
  const enSesion = req.session?.usuario;
  if (!enSesion) { req.usuario = null; return next(); }
  if (enSesion.id === INVITADO.id) { req.usuario = { ...INVITADO }; return next(); }
  const actual = Usuario.buscarPorId(enSesion.id);
  if (!actual || !actual.activo) { delete req.session.usuario; req.usuario = null; return next(); }
  req.session.usuario = actual;
  req.usuario = actual;
  next();
}

function requiereSesion(req, res, next) {
  if (!req.usuario) return res.status(401).json({ mensaje: 'Su sesión expiró. Ingrese nuevamente.' });
  next();
}

function requiereAdmin(req, res, next) {
  if (req.usuario?.rol !== 'admin') return res.status(403).json({ mensaje: 'Acción permitida solo para administradores.' });
  next();
}

/**
 * Las peticiones que modifican datos deben ser JSON. Un sitio externo no puede enviar JSON
 * con la cookie de sesión sin permiso CORS, lo que protege contra ataques CSRF.
 */
function soloJson(req, res, next) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !req.is('application/json')) {
    return res.status(415).json({ mensaje: 'Se esperaba contenido JSON.' });
  }
  next();
}

/** Limita intentos fallidos de ingreso por IP + usuario (en memoria). */
function limitarIntentos({ maximo = 8, bloqueoMs = 10 * 60 * 1000 } = {}) {
  const intentos = new Map();
  setInterval(() => { const ahora = Date.now(); for (const [k, v] of intentos) if (v.hasta < ahora) intentos.delete(k); }, bloqueoMs).unref();
  return {
    verificar(req, res, next) {
      const clave = `${req.ip}|${String(req.body?.cuenta || '').toLowerCase()}`;
      const registro = intentos.get(clave);
      if (registro && registro.fallos >= maximo && registro.hasta > Date.now()) {
        const minutos = Math.ceil((registro.hasta - Date.now()) / 60000);
        return res.status(429).json({ mensaje: `Demasiados intentos fallidos. Intente de nuevo en ${minutos} minuto(s).` });
      }
      req.claveIntentos = clave;
      next();
    },
    fallo(req) {
      const r = intentos.get(req.claveIntentos) || { fallos: 0, hasta: 0 };
      intentos.set(req.claveIntentos, { fallos: r.fallos + 1, hasta: Date.now() + bloqueoMs });
    },
    exito(req) { intentos.delete(req.claveIntentos); },
  };
}

module.exports = { INVITADO, cargarUsuario, requiereSesion, requiereAdmin, soloJson, limitarIntentos };
