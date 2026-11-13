/* Configuración de la aplicación Express (sin iniciar el servidor; ver server.js). */
const path = require('node:path');
const express = require('express');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const config = require('./config');
const SQLiteStore = require('./models/sesion.store');
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

app.use(session({
  name: 'gem.sid',
  secret: config.sesion.secreto,
  store: new SQLiteStore({ duracionMs: config.sesion.duracionMs }),
  resave: false,
  saveUninitialized: false,
  rolling: true, // la sesión se renueva mientras el usuario esté activo
  cookie: { httpOnly: true, sameSite: 'lax', secure: 'auto', maxAge: config.sesion.duracionMs },
}));
app.use(cargarUsuario);

app.use('/api', apiRoutes);
app.use('/', vistasRoutes);

app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
