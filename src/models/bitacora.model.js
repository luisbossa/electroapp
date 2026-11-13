/* Modelo: bitácora de acciones (ingresos y cambios de datos). */
const { db } = require('../database/conexion');

const insertar = db.prepare('INSERT INTO bitacora (usuario, accion, detalle) VALUES (?, ?, ?)');

function registrar(usuario, accion, detalle = null) {
  try {
    insertar.run(String(usuario || 'sistema'), accion, detalle == null ? null : String(detalle));
  } catch (error) {
    console.error('No se pudo escribir en la bitácora:', error.message);
  }
}

module.exports = { registrar };
