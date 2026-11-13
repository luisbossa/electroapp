/* Controlador: ingreso, invitado, cierre y estado de la sesión. */
const Usuario = require('../models/usuario.model');
const Bitacora = require('../models/bitacora.model');
const { INVITADO, limitarIntentos } = require('../middlewares/autenticacion');

const intentos = limitarIntentos();

/** Regenera el id de sesión al ingresar (evita fijación de sesión) y guarda el usuario. */
function iniciarSesion(req, usuario) {
  return new Promise((resolve, reject) => {
    req.session.regenerate(err => {
      if (err) return reject(err);
      req.session.usuario = usuario;
      req.session.save(e => (e ? reject(e) : resolve()));
    });
  });
}

/** GET /api/estado → { usuario } (null si no hay sesión). */
function estado(req, res) {
  res.json({ usuario: req.usuario });
}

/** POST /api/login { cuenta, clave } → { usuario } */
async function login(req, res) {
  const { cuenta, clave } = req.body || {};
  if (!String(cuenta || '').trim() || !clave) return res.status(400).json({ mensaje: 'Ingrese usuario y contraseña.' });
  const usuario = await Usuario.verificarCredenciales(cuenta, clave);
  if (!usuario) {
    intentos.fallo(req);
    Bitacora.registrar(cuenta, 'ingreso-fallido', req.ip);
    return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos, o la cuenta está inactiva.' });
  }
  intentos.exito(req);
  await iniciarSesion(req, usuario);
  Bitacora.registrar(usuario.usuario, 'ingreso', req.ip);
  res.json({ usuario });
}

/** POST /api/invitado → { usuario } (solo consulta) */
async function invitado(req, res) {
  await iniciarSesion(req, { ...INVITADO });
  res.json({ usuario: { ...INVITADO } });
}

/** POST /api/logout */
function logout(req, res, next) {
  const nombre = req.usuario?.usuario;
  req.session.destroy(err => {
    if (err) return next(err);
    if (nombre) Bitacora.registrar(nombre, 'salida');
    res.clearCookie('gem.sid');
    res.json({ ok: true });
  });
}

module.exports = { estado, login, invitado, logout, verificarIntentos: intentos.verificar };
