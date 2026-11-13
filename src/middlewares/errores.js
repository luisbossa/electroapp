/* Manejo de rutas inexistentes y errores. La API responde JSON { mensaje }, que muestra la interfaz. */

function noEncontrado(req, res) {
  if (req.path.startsWith('/api/')) return res.status(404).json({ mensaje: 'Ruta no encontrada.' });
  res.status(404).render('pages/error', { titulo: 'Página no encontrada', codigo: 404, mensaje: 'La página que busca no existe.', layout: false });
}

// eslint-disable-next-line no-unused-vars
function manejarErrores(error, req, res, _next) {
  let status = error.status || error.statusCode || 500;
  let mensaje = status < 500 ? error.message : 'Ocurrió un error interno. Intente nuevamente.';
  if (error.type === 'entity.too.large') mensaje = 'La información enviada es demasiado grande (revise el tamaño de las fotos).';
  if (error.type === 'entity.parse.failed') { status = 400; mensaje = 'El formato de los datos no es válido.'; }
  if (status >= 500) console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, error);
  if (req.path.startsWith('/api/')) return res.status(status).json({ mensaje });
  res.status(status).render('pages/error', { titulo: 'Error', codigo: status, mensaje, layout: false });
}

module.exports = { noEncontrado, manejarErrores };
