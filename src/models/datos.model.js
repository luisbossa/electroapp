/* Modelo: registros de los módulos (equipos, bodega, averías, ...).
   Cada módulo tiene su tabla; cada registro es una fila con su contenido JSON. */
const { db, transaccion } = require('../database/conexion');

/** Nombre que usa la interfaz → tabla de SQLite. */
const COLECCIONES = Object.freeze({
  equipos: 'equipos',
  bodega: 'bodega',
  ordenes: 'ordenes_trabajo',
  movimientos: 'movimientos_bodega',
  salidasEquipos: 'salidas_equipos',
  proveedores: 'proveedores',
  averias: 'averias',
  procedimientos: 'procedimientos',
  cronogramasPreventivos: 'cronogramas_preventivos',
  preventiveContracts: 'contratos_preventivos',
  ubicaciones: 'ubicaciones',
});

const sql = Object.fromEntries(Object.entries(COLECCIONES).map(([clave, tabla]) => [clave, {
  listar: db.prepare(`SELECT datos FROM ${tabla} ORDER BY posicion`),
  contar: db.prepare(`SELECT COUNT(*) AS total FROM ${tabla}`),
  vaciar: db.prepare(`DELETE FROM ${tabla}`),
  insertar: db.prepare(`INSERT INTO ${tabla} (posicion, id, datos) VALUES (?, ?, ?)`),
}]));

const leer = clave => sql[clave].listar.all().map(f => JSON.parse(f.datos));

/** Devuelve todos los módulos: { equipos: [...], bodega: [...], ... } */
function obtenerTodo() {
  return Object.fromEntries(Object.keys(COLECCIONES).map(clave => [clave, leer(clave)]));
}

function estaVacia() {
  return Object.keys(COLECCIONES).every(clave => sql[clave].contar.get().total === 0);
}

function reemplazar(clave, registros) {
  const s = sql[clave];
  s.vaciar.run();
  registros.forEach((r, i) => {
    const id = r && typeof r === 'object' && r.id != null ? String(r.id) : null;
    s.insertar.run(i, id, JSON.stringify(r));
  });
}

/**
 * Guarda los módulos recibidos (solo los que cambiaron) en una única transacción.
 * Devuelve la lista de módulos modificados.
 */
function guardar(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') throw Object.assign(new Error('Datos no válidos.'), { status: 400 });
  const cambiados = [];
  transaccion(() => {
    for (const clave of Object.keys(COLECCIONES)) {
      const registros = snapshot[clave];
      if (registros === undefined) continue;
      if (!Array.isArray(registros)) throw Object.assign(new Error(`"${clave}" debe ser una lista.`), { status: 400 });
      if (JSON.stringify(registros) === JSON.stringify(leer(clave))) continue;
      reemplazar(clave, registros);
      cambiados.push(clave);
    }
  });
  return cambiados;
}

module.exports = { COLECCIONES, obtenerTodo, estaVacia, guardar };
