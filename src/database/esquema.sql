-- Esquema de la base de datos SQLite (data/gestion.db).
-- Se aplica al iniciar el servidor; todas las sentencias son idempotentes.

CREATE TABLE IF NOT EXISTS usuarios (
  id            TEXT PRIMARY KEY,
  nombre        TEXT NOT NULL,
  usuario       TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  rol           TEXT NOT NULL DEFAULT 'usuario' CHECK (rol IN ('admin', 'usuario', 'invitado')),
  activo        INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  creado        TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  actualizado   TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

-- Las sesiones viajan en una cookie firmada; la tabla anterior ya no se usa.
DROP TABLE IF EXISTS sesiones;

-- Una tabla por módulo. Cada fila es un registro del módulo guardado como JSON,
-- para conservar intactos los campos que maneja la interfaz.
-- Consultas de ejemplo: SELECT json_extract(datos, '$.nombre') FROM equipos;
CREATE TABLE IF NOT EXISTS equipos                 (posicion INTEGER PRIMARY KEY, id TEXT, datos TEXT NOT NULL CHECK (json_valid(datos)), actualizado TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));
CREATE TABLE IF NOT EXISTS bodega                  (posicion INTEGER PRIMARY KEY, id TEXT, datos TEXT NOT NULL CHECK (json_valid(datos)), actualizado TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));
CREATE TABLE IF NOT EXISTS ordenes_trabajo         (posicion INTEGER PRIMARY KEY, id TEXT, datos TEXT NOT NULL CHECK (json_valid(datos)), actualizado TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));
CREATE TABLE IF NOT EXISTS movimientos_bodega      (posicion INTEGER PRIMARY KEY, id TEXT, datos TEXT NOT NULL CHECK (json_valid(datos)), actualizado TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));
CREATE TABLE IF NOT EXISTS salidas_equipos         (posicion INTEGER PRIMARY KEY, id TEXT, datos TEXT NOT NULL CHECK (json_valid(datos)), actualizado TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));
CREATE TABLE IF NOT EXISTS proveedores             (posicion INTEGER PRIMARY KEY, id TEXT, datos TEXT NOT NULL CHECK (json_valid(datos)), actualizado TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));
CREATE TABLE IF NOT EXISTS averias                 (posicion INTEGER PRIMARY KEY, id TEXT, datos TEXT NOT NULL CHECK (json_valid(datos)), actualizado TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));
CREATE TABLE IF NOT EXISTS procedimientos          (posicion INTEGER PRIMARY KEY, id TEXT, datos TEXT NOT NULL CHECK (json_valid(datos)), actualizado TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));
CREATE TABLE IF NOT EXISTS cronogramas_preventivos (posicion INTEGER PRIMARY KEY, id TEXT, datos TEXT NOT NULL CHECK (json_valid(datos)), actualizado TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));
CREATE TABLE IF NOT EXISTS contratos_preventivos   (posicion INTEGER PRIMARY KEY, id TEXT, datos TEXT NOT NULL CHECK (json_valid(datos)), actualizado TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));
CREATE TABLE IF NOT EXISTS ubicaciones             (posicion INTEGER PRIMARY KEY, id TEXT, datos TEXT NOT NULL CHECK (json_valid(datos)), actualizado TEXT NOT NULL DEFAULT (datetime('now', 'localtime')));

-- Bitácora de cambios: quién guardó qué módulo y cuándo.
CREATE TABLE IF NOT EXISTS bitacora (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha    TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  usuario  TEXT NOT NULL,
  accion   TEXT NOT NULL,
  detalle  TEXT
);
