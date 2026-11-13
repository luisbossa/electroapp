/* Controlador: administración de usuarios (solo administradores). */
const Usuario = require('../models/usuario.model');
const Bitacora = require('../models/bitacora.model');

/** GET /api/usuarios → { usuarios } (sin contraseñas) */
function listar(_req, res) {
  res.json({ usuarios: Usuario.listar() });
}

/** PUT /api/usuarios/sync { usuarios: [...] } → { usuarios } */
function sincronizar(req, res) {
  const usuarios = Usuario.sincronizar(req.body?.usuarios, req.usuario);
  Bitacora.registrar(req.usuario.usuario, 'guardar-usuarios', `${usuarios.length} usuario(s)`);
  res.json({ usuarios });
}

module.exports = { listar, sincronizar };
