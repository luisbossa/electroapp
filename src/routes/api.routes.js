/* Rutas de la API JSON que consume public/js/adaptador-servidor.js. */
const { Router } = require('express');
const auth = require('../controllers/auth.controller');
const datos = require('../controllers/datos.controller');
const usuarios = require('../controllers/usuarios.controller');
const { requiereSesion, requiereAdmin, soloJson } = require('../middlewares/autenticacion');

/** Express 4 no captura errores de funciones async: los pasa al manejador de errores. */
const asincrono = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const router = Router();
router.use(soloJson);
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

// Sesión
router.get('/estado', auth.estado);
router.post('/login', auth.verificarIntentos, asincrono(auth.login));
router.post('/invitado', auth.invitado);
router.post('/logout', auth.logout);

// Datos de los módulos
router.get('/datos', requiereSesion, datos.obtener);
router.put('/datos', requiereSesion, requiereAdmin, datos.guardar);

// Usuarios
router.get('/usuarios', requiereSesion, requiereAdmin, usuarios.listar);
router.put('/usuarios/sync', requiereSesion, requiereAdmin, usuarios.sincronizar);

module.exports = router;
