/* Carga inicial: la primera vez que se inicia el servidor (base vacía) se crean el administrador
   y los datos de demostración que trae public/js/datos-iniciales.js, para que todos los
   navegadores vean la misma información desde el principio. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const config = require('../config');
const Usuario = require('../models/usuario.model');
const Datos = require('../models/datos.model');

/** Ejecuta datos-iniciales.js en un entorno aislado y devuelve sus arreglos de ejemplo. */
function leerDatosDemostracion() {
  const archivo = path.join(config.raiz, 'public', 'js', 'datos-iniciales.js');
  const codigo = fs.readFileSync(archivo, 'utf8') + `
    ;({ equipos: initEquipos, bodega: initBodega, ordenes: initOT, movimientos: initMovs,
        salidasEquipos: initSalidasEquipos, proveedores: initProvs, averias: initAverias,
        procedimientos: initProcedimientos, cronogramasPreventivos: [], preventiveContracts: [],
        ubicaciones: [...new Set([...DEFAULT_UBICACIONES, ...initEquipos.map(e => e.ubicacion).filter(Boolean)])] })`;
  const almacenVacio = { getItem: () => null, setItem() {}, removeItem() {} };
  const resultado = vm.runInNewContext(codigo, { localStorage: almacenVacio, sessionStorage: almacenVacio, console }, { timeout: 2000 });
  return JSON.parse(JSON.stringify(resultado)); // objetos planos fuera del contexto aislado
}

function sembrar() {
  if (Usuario.asegurarAdminInicial(config.adminInicial)) {
    console.log(`  · Administrador inicial creado: usuario "${config.adminInicial.usuario}".`);
    if (!process.env.ADMIN_PASSWORD) console.warn('  ! Contraseña por defecto "admin123": cámbiela desde el módulo Usuarios.');
  }
  if (Datos.estaVacia()) {
    try {
      Datos.guardar(leerDatosDemostracion());
      console.log('  · Base de datos vacía: se cargaron los datos de demostración.');
    } catch (error) {
      console.warn('  ! No se pudieron cargar los datos de demostración:', error.message);
    }
  }
}

module.exports = { sembrar, leerDatosDemostracion };
