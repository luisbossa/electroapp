/* Configuración de la aplicación Express (sin iniciar el servidor; ver server.js). */
const path = require('node:path');
const express = require('express');
const cookieSession = require('cookie-session');
const expressLayouts = require('express-ejs-layouts');
const config = require('./config');
const { cargarUsuario } = require('./middlewares/autenticacion');
const { noEncontrado, manejarErrores } = require('./middlewares/errores');
const apiRoutes = require('./routes/api.routes');
const vistasRoutes = require('./routes/vistas.routes');

const app = express();

app.disable('x-powered-by');
if (config.confiarProxy) app.set('trust proxy', 1);

// Vistas: EJS con layout común (src/views/layouts/principal.ejs)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/principal');
app.locals.version = config.version;
app.locals.modoDemo = config.modoDemo;

// Cabeceras de seguridad básicas
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'same-origin',
  });
  next();
});

// Archivos estáticos: public/css, public/js, public/assets
app.use(express.static(path.join(config.raiz, 'public'), { maxAge: config.produccion ? '1h' : 0, index: false }));

app.use(express.json({ limit: config.limiteJson }));

// Sesión en cookie firmada (sin estado en el servidor): funciona igual con una o varias
// instancias (Vercel). En cada petición se vuelve a validar el usuario contra la base de datos.
app.use(cookieSession({
  name: 'gem.sid',
  keys: [config.sesion.secreto],
  maxAge: config.sesion.duracionMs,
  httpOnly: true,
  sameSite: 'lax',
  secure: config.cookieSegura, // solo HTTPS (COOKIE_SECURE; por defecto sigue a TRUST_PROXY)
}));
app.use(cargarUsuario);

app.use('/api', apiRoutes);
app.use('/', vistasRoutes);

app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
