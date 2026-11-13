/* Rutas de páginas (vistas EJS). */
const { Router } = require('express');
const vistas = require('../controllers/vistas.controller');

const router = Router();
router.get('/', vistas.sistema);

module.exports = router;
