/* Conexión única a SQLite usando el módulo integrado de Node (node:sqlite), sin dependencias nativas. */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

const db = new DatabaseSync(config.baseDatos);

db.exec(`
  PRAGMA journal_mode = WAL;     -- lecturas y escrituras concurrentes
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
`);
db.exec(fs.readFileSync(path.join(__dirname, 'esquema.sql'), 'utf8'));

/** Ejecuta fn dentro de una transacción; si algo falla, revierte todos los cambios. */
function transaccion(fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const resultado = fn();
    db.exec('COMMIT');
    return resultado;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

module.exports = { db, transaccion };
