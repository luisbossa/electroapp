/* Entrada para Vercel (función serverless). Todas las rutas que no son archivos de public/
   llegan aquí (ver vercel.json). En local se usa server.js. */
const { sembrar } = require('../src/database/semilla');

sembrar(); // en Vercel la base vive en /tmp: se crea con los datos de demostración en cada arranque en frío

module.exports = require('../src/app');
