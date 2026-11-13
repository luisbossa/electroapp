/* Restablece la contraseña de un administrador (o lo crea si no existe).
   Uso:  npm run db:reset-admin -- <usuario> <nueva-contraseña>
   Ej.:  npm run db:reset-admin -- admin MiClaveSegura2026 */
const Usuario = require('../src/models/usuario.model');

const [usuario, password] = process.argv.slice(2);
if (!usuario || !password) {
  console.error('Uso: npm run db:reset-admin -- <usuario> <nueva-contraseña>');
  process.exit(1);
}
try {
  Usuario.restablecerAdmin({ usuario, password });
  console.log(`Listo: "${usuario}" es administrador activo con la nueva contraseña.`);
} catch (error) {
  console.error('No se pudo restablecer:', error.message);
  process.exit(1);
}
