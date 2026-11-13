/* Controlador: páginas renderizadas con EJS. */

/** GET / → aplicación completa (pantalla de ingreso + módulos). */
function sistema(_req, res) {
  res.render('pages/sistema', { titulo: 'Gestión de Equipo Médico - Sistema Integral' });
}

module.exports = { sistema };
