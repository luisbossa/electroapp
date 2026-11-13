# Gestión de Equipo Médico — Área de Salud Naranjo

Aplicación web en **Node.js + Express**, con vistas **EJS** (layout con `express-ejs-layouts`), arquitectura **MVC** y base de datos **SQLite** guardada dentro del proyecto (`data/gestion.db`).

## Requisitos

- **Node.js 22.13 o superior** (se probó con Node 26). SQLite viene integrado en Node (`node:sqlite`): no hay que instalar ni compilar nada más.
- Conexión a internet en los navegadores: la interfaz carga Tailwind, Lucide, Chart.js y SweetAlert2 desde CDN.

## Instalación y uso

```bash
npm install        # solo la primera vez
npm start          # inicia el servidor en http://localhost:3000
npm run dev        # igual, pero se reinicia solo al modificar archivos del servidor
```

La primera vez que se inicia:

- se crea `data/gestion.db` con todas las tablas;
- se crea el administrador inicial (**usuario `admin`, contraseña `admin123`**, o los valores de `ADMIN_USER` / `ADMIN_PASSWORD` en `.env`);
- se cargan los datos de demostración, para que todos los navegadores vean la misma información.

> **Cambie la contraseña de `admin`** desde el módulo *Administración de Usuarios* antes de cargar datos reales.

Otros equipos de la red pueden entrar con la dirección `http://<IP-del-servidor>:3000`, que se muestra en la consola al iniciar.

### Configuración (`.env`)

Copie `.env.example` como `.env` y ajuste: puerto, ubicación de la base de datos, administrador inicial, duración de la sesión y `TRUST_PROXY` (solo si hay un proxy HTTPS delante).

### ¿Olvidó la contraseña del administrador?

```bash
npm run db:reset-admin -- admin NuevaClaveSegura
```

### Respaldo

Toda la información está en la carpeta `data/`. Para respaldar, detenga el servidor y copie `data/gestion.db`. También puede usar cualquier visor de SQLite (por ejemplo, *DB Browser for SQLite*).

## Estructura del proyecto

```
├── server.js                    Punto de entrada: prepara la base y levanta el servidor
├── package.json
├── .env.example                 Variables de configuración
├── scripts/
│   └── restablecer-admin.js     Restablece la contraseña de un administrador
├── data/                        (se crea solo) gestion.db y secreto de sesión — NO subir a git
├── public/                      Archivos estáticos que descarga el navegador
│   ├── assets/                  Imágenes (fondo del login)
│   ├── css/                     Estilos (base, capas, login, ventanas, fichas, confirmaciones)
│   └── js/                      Lógica de la interfaz (un archivo por módulo)
└── src/
    ├── app.js                   Configuración de Express (vistas, sesiones, rutas, errores)
    ├── config/index.js          Lee la configuración y variables de entorno
    ├── database/
    │   ├── conexion.js          Conexión SQLite y transacciones
    │   ├── esquema.sql          Tablas
    │   └── semilla.js           Administrador y datos de demostración iniciales
    ├── models/                  M — acceso a datos
    │   ├── usuario.model.js     Usuarios y contraseñas (hash bcrypt)
    │   ├── datos.model.js       Registros de los módulos
    │   ├── bitacora.model.js    Registro de ingresos y cambios
    │   └── sesion.store.js      Sesiones guardadas en SQLite
    ├── controllers/             C — reciben la petición y responden
    │   ├── auth.controller.js   Ingreso, invitado, salida, estado
    │   ├── datos.controller.js  Leer / guardar módulos
    │   ├── usuarios.controller.js
    │   └── vistas.controller.js Renderiza las páginas
    ├── routes/
    │   ├── api.routes.js        /api/...
    │   └── vistas.routes.js     /
    ├── middlewares/
    │   ├── autenticacion.js     Sesión, roles, protección CSRF y límite de intentos
    │   └── errores.js           404 y manejo de errores
    └── views/                   V — plantillas EJS
        ├── layouts/principal.ejs    <head>, librerías y estilos comunes
        ├── pages/sistema.ejs        Página principal: reúne los parciales en orden
        ├── pages/error.ejs
        ├── partials/                login, menú lateral, barra superior, bienvenida, scripts
        ├── vistas/                  una plantilla por pestaña (equipos, bodega, averías, ...)
        └── modales/                 una plantilla por ventana emergente
```

### Cómo encaja el MVC con la interfaz

La interfaz es una aplicación de una sola página: el servidor entrega la página completa (EJS) y luego los módulos de `public/js/` trabajan en el navegador. Cuando hay cambios, `public/js/adaptador-servidor.js` los envía a la API, que los valida y los guarda en SQLite.

**Para modificar una pantalla:** edite su plantilla en `src/views/vistas/` o `src/views/modales/`. **Para la lógica de esa pantalla:** su archivo en `public/js/`. Los scripts del cliente comparten variables globales: **no cambie su orden** en `src/views/partials/scripts.ejs`.

## API

| Método | Ruta | Acceso | Uso |
| --- | --- | --- | --- |
| GET | `/api/estado` | público | Usuario de la sesión actual (o `null`) |
| POST | `/api/login` | público | `{ cuenta, clave }` → inicia sesión |
| POST | `/api/invitado` | público | Sesión de solo consulta |
| POST | `/api/logout` | sesión | Cierra la sesión |
| GET | `/api/datos` | sesión | Todos los módulos |
| PUT | `/api/datos` | admin | Guarda los módulos modificados |
| GET | `/api/usuarios` | admin | Lista de usuarios (sin contraseñas) |
| PUT | `/api/usuarios/sync` | admin | Crea, actualiza y elimina usuarios |

## Base de datos

| Tabla | Contenido |
| --- | --- |
| `usuarios` | Cuentas, rol (`admin`, `usuario`, `invitado`), estado y hash de la contraseña |
| `sesiones` | Sesiones activas |
| `bitacora` | Ingresos (correctos y fallidos) y guardados: quién, qué y cuándo |
| `equipos`, `bodega`, `ordenes_trabajo`, `movimientos_bodega`, `salidas_equipos`, `proveedores`, `averias`, `procedimientos`, `cronogramas_preventivos`, `contratos_preventivos`, `ubicaciones` | Una fila por registro; la columna `datos` contiene el registro en JSON |

Ejemplo de consulta: `SELECT json_extract(datos, '$.activo'), json_extract(datos, '$.nombre') FROM equipos;`

## Seguridad

- Contraseñas con hash **bcrypt**; nunca se envían al navegador.
- Cookie de sesión `httpOnly` y `SameSite=Lax`; el id de sesión se renueva al ingresar.
- Solo los administradores pueden modificar datos o usuarios, y el servidor lo verifica en cada petición. Si un usuario se desactiva, pierde el acceso al instante.
- Bloqueo temporal tras 8 intentos fallidos de ingreso.
- Las peticiones que modifican datos deben ser JSON (protección CSRF).
- Para usarlo fuera de la red interna, publíquelo detrás de HTTPS (IIS o Nginx) con `TRUST_PROXY=true`.
