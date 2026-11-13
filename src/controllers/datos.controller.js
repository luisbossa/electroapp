/* Controlador: lectura y guardado de los módulos del sistema. */
const Datos = require('../models/datos.model');
const Bitacora = require('../models/bitacora.model');

/** GET /api/datos → { datos: { equipos: [...], bodega: [...], ... } } */
function obtener(_req, res) {
  res.json({ datos: Datos.obtenerTodo() });
}

/** PUT /api/datos (solo administradores) → { ok, cambiados } */
function guardar(req, res) {
  const cambiados = Datos.guardar(req.body);
  if (cambiados.length) Bitacora.registrar(req.usuario.usuario, 'guardar-datos', cambiados.join(', '));
  res.json({ ok: true, cambiados });
}

module.exports = { obtener, guardar };
