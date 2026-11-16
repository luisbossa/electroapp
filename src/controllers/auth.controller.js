/* Controlador: ingreso, invitado, cierre y estado de la sesión. */
const Usuario = require('../models/usuario.model');
const Bitacora = require('../models/bitacora.model');
const config = require('../config');
const { INVITADO, limitarIntentos } = require('../middlewares/autenticacion');

const intentos = limitarIntentos();

/** Guarda el usuario en la cookie de sesión firmada (se reemplaza todo su contenido). */
function iniciarSesion(req, usuario) {
  const ahora = Date.now();
  req.session = { usuario, inicio: ahora, actividad: ahora };
}

/** GET /api/estado → { usuario, inactividadMs, sesionExpirada } (usuario null si no hay sesión). */
function estado(req, res) {
  res.json({ usuario: req.usuario, inactividadMs: config.sesion.inactividadMs, sesionExpirada: Boolean(req.sesionExpirada) });
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
  iniciarSesion(req, usuario);
  Bitacora.registrar(usuario.usuario, 'ingreso', req.ip);
  res.json({ usuario, inactividadMs: config.sesion.inactividadMs });
}

/** POST /api/invitado → { usuario } (solo consulta) */
function invitado(req, res) {
  iniciarSesion(req, { ...INVITADO });
  res.json({ usuario: { ...INVITADO }, inactividadMs: config.sesion.inactividadMs });
}

/** POST /api/logout */
function logout(req, res) {
  if (req.usuario) Bitacora.registrar(req.usuario.usuario, 'salida');
  req.session = null; // borra la cookie
  res.json({ ok: true });
}

module.exports = { estado, login, invitado, logout, verificarIntentos: intentos.verificar };
