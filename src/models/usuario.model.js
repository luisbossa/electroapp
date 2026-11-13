/* Modelo: usuarios del sistema. Las contraseñas se guardan solo como hash bcrypt. */
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { db, transaccion } = require('../database/conexion');

const ROLES = new Set(['admin', 'usuario', 'invitado']);
const COSTO_HASH = 10;
// Hash ficticio para que una cuenta inexistente tarde lo mismo que una contraseña incorrecta.
const HASH_FICTICIO = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), COSTO_HASH);

const sql = {
  listar: db.prepare('SELECT * FROM usuarios ORDER BY creado, nombre'),
  porId: db.prepare('SELECT * FROM usuarios WHERE id = ?'),
  porUsuario: db.prepare('SELECT * FROM usuarios WHERE usuario = ?'), // COLLATE NOCASE en la columna
  contar: db.prepare('SELECT COUNT(*) AS total FROM usuarios'),
  insertar: db.prepare(`INSERT INTO usuarios (id, nombre, usuario, password_hash, rol, activo)
                        VALUES (:id, :nombre, :usuario, :password_hash, :rol, :activo)`),
  actualizar: db.prepare(`UPDATE usuarios SET nombre = :nombre, usuario = :usuario, rol = :rol, activo = :activo,
                          password_hash = COALESCE(:password_hash, password_hash), actualizado = datetime('now', 'localtime')
                          WHERE id = :id`),
  eliminar: db.prepare('DELETE FROM usuarios WHERE id = ?'),
};

class ErrorValidacion extends Error {
  constructor(mensaje) { super(mensaje); this.status = 400; }
}

/** Datos seguros para enviar al navegador (sin hash). */
function publico(fila) {
  if (!fila) return null;
  return { id: fila.id, nombre: fila.nombre, usuario: fila.usuario, rol: fila.rol, activo: fila.activo === 1 };
}

const listar = () => sql.listar.all().map(publico);
const buscarPorId = id => publico(sql.porId.get(String(id)));

/** Devuelve el usuario público si las credenciales son válidas y la cuenta está activa; si no, null. */
async function verificarCredenciales(usuario, password) {
  const fila = sql.porUsuario.get(String(usuario || '').trim());
  const valida = await bcrypt.compare(String(password || ''), fila?.password_hash || HASH_FICTICIO);
  return valida && fila && fila.activo === 1 ? publico(fila) : null;
}

function normalizar(u) {
  const nombre = String(u.nombre || '').trim();
  const usuario = String(u.usuario || '').trim();
  const rol = String(u.rol || 'usuario');
  if (!nombre) throw new ErrorValidacion('El nombre es obligatorio.');
  if (!/^[\w.@-]{3,40}$/.test(usuario)) throw new ErrorValidacion(`Nombre de usuario no válido: "${usuario}". Use de 3 a 40 letras, números, punto, guion o @.`);
  if (!ROLES.has(rol)) throw new ErrorValidacion(`Rol no válido: ${rol}`);
  return { nombre, usuario, rol, activo: u.activo === false || u.activo === 0 ? 0 : 1 };
}

function hashPassword(password) {
  if (String(password).length < 6) throw new ErrorValidacion('La contraseña debe tener al menos 6 caracteres.');
  return bcrypt.hashSync(String(password), COSTO_HASH);
}

function crear({ id, password, ...resto }) {
  const datos = normalizar(resto);
  sql.insertar.run({ id: id || 'usr-' + crypto.randomUUID(), password_hash: hashPassword(password), ...datos });
}

/**
 * Sincroniza la lista completa enviada por la pantalla de Usuarios:
 * crea los nuevos, actualiza los existentes (la contraseña solo si se envía) y elimina los ausentes.
 */
function sincronizar(lista, actor) {
  if (!Array.isArray(lista)) throw new ErrorValidacion('Se esperaba una lista de usuarios.');
  transaccion(() => {
    const recibidos = new Set();
    const nombres = new Set();
    for (const u of lista) {
      const datos = normalizar(u);
      const clave = datos.usuario.toLowerCase();
      if (nombres.has(clave)) throw new ErrorValidacion(`El usuario "${datos.usuario}" está repetido.`);
      nombres.add(clave);
      const existente = u.id ? sql.porId.get(String(u.id)) : null;
      if (existente) {
        if (existente.id === actor.id && (datos.rol !== 'admin' || !datos.activo)) {
          throw new ErrorValidacion('No puede quitarse a sí mismo el acceso de administrador.');
        }
        sql.actualizar.run({ id: existente.id, password_hash: u.password ? hashPassword(u.password) : null, ...datos });
        recibidos.add(existente.id);
      } else {
        if (!u.password) throw new ErrorValidacion(`La contraseña es obligatoria para el usuario nuevo "${datos.usuario}".`);
        const id = String(u.id || 'usr-' + crypto.randomUUID());
        sql.insertar.run({ id, password_hash: hashPassword(u.password), ...datos });
        recibidos.add(id);
      }
    }
    for (const fila of sql.listar.all()) {
      if (recibidos.has(fila.id)) continue;
      if (fila.id === actor.id) throw new ErrorValidacion('No puede eliminar su propia cuenta.');
      sql.eliminar.run(fila.id);
    }
    const adminsActivos = sql.listar.all().filter(f => f.rol === 'admin' && f.activo === 1).length;
    if (!adminsActivos) throw new ErrorValidacion('Debe existir al menos un administrador activo.');
  });
  return listar();
}

/** Crea el administrador inicial la primera vez que se inicia el sistema. Devuelve true si lo creó. */
function asegurarAdminInicial({ usuario, password }) {
  if (sql.contar.get().total > 0) return false;
  crear({ id: 'admin-default', nombre: 'Administrador', usuario, password, rol: 'admin', activo: true });
  return true;
}

/** Restablece (o crea) la contraseña de un administrador. Usado por scripts/restablecer-admin.js. */
function restablecerAdmin({ usuario, password }) {
  const fila = sql.porUsuario.get(usuario);
  if (!fila) return crear({ nombre: 'Administrador', usuario, password, rol: 'admin', activo: true });
  sql.actualizar.run({ id: fila.id, nombre: fila.nombre, usuario: fila.usuario, rol: 'admin', activo: 1, password_hash: hashPassword(password) });
}

module.exports = { ROLES, ErrorValidacion, publico, listar, buscarPorId, verificarCredenciales, sincronizar, asegurarAdminInicial, restablecerAdmin };
