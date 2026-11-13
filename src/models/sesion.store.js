/* Almacén de sesiones de express-session en SQLite: las sesiones sobreviven a reinicios del servidor. */
const session = require('express-session');
const { db } = require('../database/conexion');

const sql = {
  obtener: db.prepare('SELECT datos FROM sesiones WHERE sid = ? AND expira > ?'),
  guardar: db.prepare(`INSERT INTO sesiones (sid, expira, datos) VALUES (?, ?, ?)
                       ON CONFLICT(sid) DO UPDATE SET expira = excluded.expira, datos = excluded.datos`),
  tocar: db.prepare('UPDATE sesiones SET expira = ? WHERE sid = ?'),
  eliminar: db.prepare('DELETE FROM sesiones WHERE sid = ?'),
  limpiar: db.prepare('DELETE FROM sesiones WHERE expira <= ?'),
};

class SQLiteStore extends session.Store {
  constructor({ duracionMs, intervaloLimpiezaMs = 15 * 60 * 1000 } = {}) {
    super();
    this.duracionMs = duracionMs;
    sql.limpiar.run(Date.now());
    setInterval(() => sql.limpiar.run(Date.now()), intervaloLimpiezaMs).unref();
  }

  expiracion(sesion) {
    const expira = sesion?.cookie?.expires;
    return expira ? new Date(expira).getTime() : Date.now() + this.duracionMs;
  }

  get(sid, cb) {
    try {
      const fila = sql.obtener.get(sid, Date.now());
      cb(null, fila ? JSON.parse(fila.datos) : null);
    } catch (error) { cb(error); }
  }

  set(sid, sesion, cb = () => {}) {
    try { sql.guardar.run(sid, this.expiracion(sesion), JSON.stringify(sesion)); cb(null); } catch (error) { cb(error); }
  }

  touch(sid, sesion, cb = () => {}) {
    try { sql.tocar.run(this.expiracion(sesion), sid); cb(null); } catch (error) { cb(error); }
  }

  destroy(sid, cb = () => {}) {
    try { sql.eliminar.run(sid); cb(null); } catch (error) { cb(error); }
  }
}

module.exports = SQLiteStore;
