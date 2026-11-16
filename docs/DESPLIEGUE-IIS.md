# Publicación en IIS (Windows Server)

IIS recibe las visitas y se las pasa a la aplicación de Node.js mediante **HttpPlatformHandler**, el módulo oficial de Microsoft. IIS inicia y reinicia el proceso de Node por su cuenta: no hay que dejar ninguna consola abierta ni crear un servicio aparte.

## 1. Requisitos del servidor (una sola vez)

1. **IIS** (rol *Servidor web*). No necesita ASP.NET ni otras características adicionales.
2. **Node.js 22.13 o superior**, instalador oficial de [nodejs.org](https://nodejs.org) (versión LTS). Debe quedar en `C:\Program Files\nodejs\node.exe`. Si queda en otra ruta, cámbiela en `processPath` del `web.config`.
3. **HttpPlatformHandler v1.2**: descárguelo e instálelo desde el sitio de Microsoft (*IIS HttpPlatformHandler 1.2*, versión x64).
4. Reinicie IIS: en una consola como administrador, `iisreset`.

## 2. Copiar la aplicación

1. Copie la carpeta del proyecto al servidor, por ejemplo `C:\inetpub\GestionEquipoMedico`. **No copie** `node_modules`, `data` ni `logs`.
2. En esa carpeta, abra una consola y ejecute:

   ```bat
   npm ci --omit=dev
   ```

   Solo instala lo necesario para funcionar. Los estilos (`public/css/`, CSS puro) y las librerías (`public/vendor/`) ya vienen incluidos en el proyecto.
3. Cree el archivo `.env` a partir de `.env.example` y defina como mínimo:

   ```ini
   ADMIN_PASSWORD=una-clave-segura
   SESSION_SECRET=un-texto-aleatorio-largo
   ```

   Para generar `SESSION_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
   Lo que se define en `web.config` (puerto, respaldos, etc.) tiene prioridad sobre `.env`.

## 3. Crear el sitio en IIS

1. **Grupos de aplicaciones → Agregar**: nombre `GestionEquipoMedico`, *Versión de .NET CLR*: **Sin código administrado**.
2. En la **Configuración avanzada** de ese grupo:
   - *Modo de inicio*: **AlwaysRunning**.
   - *Tiempo de espera de inactividad (minutos)*: **0**.
   - *Reciclaje → Intervalo de tiempo regular (minutos)*: **0** (o programe el reciclaje de madrugada).

   Así el proceso no se apaga cuando no hay usuarios y **los respaldos automáticos siguen corriendo**.
3. **Sitios → Agregar sitio web**: ruta física `C:\inetpub\GestionEquipoMedico`, grupo de aplicaciones `GestionEquipoMedico`, y el puerto o nombre de host que corresponda (por ejemplo, puerto 80).

## 4. Permisos de carpetas

La identidad del grupo de aplicaciones (`IIS AppPool\GestionEquipoMedico`) necesita permiso de **Modificar** en:

| Carpeta | Para qué |
| --- | --- |
| `data\` | Base de datos SQLite y secreto de sesión |
| `logs\` | Registro de la consola de Node (arranque, errores, respaldos) |
| Carpeta de respaldos | Solo si `BACKUP_DIR` apunta fuera de `data\` |

En una consola como administrador:

```bat
cd C:\inetpub\GestionEquipoMedico
mkdir data logs
icacls data /grant "IIS AppPool\GestionEquipoMedico":(OI)(CI)M
icacls logs /grant "IIS AppPool\GestionEquipoMedico":(OI)(CI)M
```

Si usa una carpeta de red para respaldos, la identidad del grupo debe tener acceso a ella; en ese caso suele ser más simple configurar el grupo con una cuenta de servicio del dominio.

## 5. Primer ingreso

Abra el sitio en el navegador. La primera vez se crea `data\gestion.db` y el usuario `admin` con la clave de `ADMIN_PASSWORD`. Cámbiela desde *Administración de Usuarios*.

Si el sitio no carga, revise el archivo más reciente de `logs\`: ahí aparece el error de Node.

## 6. Respaldos de la base de datos

Mientras el sitio está en marcha, la aplicación hace un respaldo cada `BACKUP_INTERVAL_HOURS` horas (por defecto **24**) y conserva los últimos `BACKUP_KEEP` (por defecto **30**, unos 30 días). Se configuran en `web.config`:

```xml
<environmentVariable name="BACKUP_INTERVAL_HOURS" value="24" />
<environmentVariable name="BACKUP_KEEP" value="30" />
<environmentVariable name="BACKUP_DIR" value="D:\Respaldos\GestionEquipoMedico" />
```

- Cada respaldo es un archivo `.db` completo, por ejemplo `gestion_2026-11-16_02-00-00.db`. Se hace sin detener el sistema y se verifica su integridad antes de guardarlo.
- Al reiniciar el sitio, si el último respaldo es más viejo que el intervalo, se respalda de inmediato.
- **Recomendado:** que `BACKUP_DIR` esté en **otro disco o en una carpeta de red**. Un respaldo en el mismo disco no sirve si el disco falla.
- Cada respaldo queda anotado en `logs\`, con la línea `[respaldo]`.

### Respaldo manual

```bat
npm run db:respaldar            :: crea un respaldo ahora
npm run db:respaldar -- --lista :: muestra los respaldos existentes
```

Si prefiere no depender del proceso de IIS, puede desactivar el automático (`BACKUP_INTERVAL_HOURS` en `0`) y programar `npm run db:respaldar` con el **Programador de tareas de Windows**: acción `C:\Program Files\nodejs\node.exe`, argumentos `scripts\respaldar.js`, *Iniciar en* la carpeta del proyecto. El script lee `.env`, pero no `web.config`: defina ahí `BACKUP_DIR` y `BACKUP_KEEP`.

### Restaurar un respaldo

1. Detenga el sitio en IIS.
2. En `data\`, renombre `gestion.db` (por ejemplo, a `gestion-anterior.db`) y borre `gestion.db-wal` y `gestion.db-shm` si existen.
3. Copie el respaldo elegido a `data\gestion.db`.
4. Inicie el sitio.

## 7. HTTPS (opcional)

Si configura un certificado en IIS y el sitio se usa solo por `https://`, cambie en `web.config`:

```xml
<environmentVariable name="COOKIE_SECURE" value="true" />
```

Pruebe el ingreso después del cambio. Si no puede iniciar sesión, vuelva a `false`.

## 8. Actualizar a una versión nueva

1. Haga un respaldo manual (`npm run db:respaldar`).
2. Detenga el sitio, reemplace los archivos del proyecto (**sin tocar** `data\`, `logs\` ni `.env`) y ejecute `npm ci --omit=dev`.
3. Inicie el sitio.
