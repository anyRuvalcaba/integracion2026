# Despliegue en Render

El monorepo no usa workspaces (npm/pnpm/yarn) ni un `package.json` raíz: `ecommerce-api` y `ecommerce-app` son dos paquetes independientes. En Render se configuran como **dos servicios separados**, cada uno con su propio Root Directory.

Variables detalladas: [environment-variables.md](environment-variables.md).

---

## Servicio backend — Web Service

| Campo | Valor |
|---|---|
| Root Directory | `ecommerce-api` |
| Install Command | `npm install` |
| Build Command | *(ninguno — no hay paso de compilación)* |
| Start Command | `npm start` |

Variables de entorno a configurar en Render:

```env
NODE_ENV=production
FRONTEND_URL=https://<nombre-del-servicio-frontend>.onrender.com
CORS_ALLOWED_ORIGINS=https://<nombre-del-servicio-frontend>.onrender.com
MONGODB_URI=<connection string real, p.ej. MongoDB Atlas>
JWT_SECRET=<secreto real, no reusar el de desarrollo>
JWT_REFRESH_TOKEN=<secreto real, no reusar el de desarrollo>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

`PORT` no se configura manualmente: Render lo inyecta y `server.js` ya lo lee vía `process.env.PORT` (con fallback a `4000` solo si no está definido). El servidor escucha en `0.0.0.0` (`app.listen(port, "0.0.0.0", ...)`), requisito de Render para aceptar conexiones externas — no en `localhost`.

Si Render aloja MongoDB en un servicio separado (o se usa MongoDB Atlas), la URI de conexión no debe apuntar a `localhost`.

---

## Servicio frontend — Static Site

| Campo | Valor |
|---|---|
| Root Directory | `ecommerce-app` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Publish Directory | `build` |

Variable de entorno a configurar en Render (se incorpora al bundle durante `npm run build`, CRA la toma directamente de `process.env`):

```env
REACT_APP_API_URL=https://<nombre-del-servicio-backend>.onrender.com/api
```

Importante: si la URL del backend cambia, hay que **reconstruir y redeployar el frontend** — `REACT_APP_API_URL` no es una variable de runtime, queda inlineada en el JS servido como archivos estáticos.

---

## Orden de despliegue recomendado

1. Desplegar el backend primero (o con una URL de frontend provisional en `FRONTEND_URL`/`CORS_ALLOWED_ORIGINS`).
2. Tomar la URL asignada por Render al backend.
3. Desplegar el frontend con `REACT_APP_API_URL` apuntando a esa URL.
4. Tomar la URL asignada por Render al frontend.
5. Volver al servicio backend y actualizar `FRONTEND_URL`/`CORS_ALLOWED_ORIGINS` con la URL real del frontend, luego redeploy.

Este último paso es inevitable: Render no permite conocer la URL final de un servicio antes de crearlo, así que la primera ronda de variables cruzadas siempre es provisional.

---

## Cookies

El proyecto no usa cookies de sesión: la autenticación es JWT vía header `Authorization: Bearer <token>`, almacenado en `localStorage` del navegador (`src/utils/auth.js`). No aplica configuración de `httpOnly`, `secure`, `sameSite`, `domain` ni `trust proxy` porque no hay cookies que proteger. Si en el futuro se introduce autenticación por cookies, revisar esta sección.

## WebSockets, OAuth, emails

No existen en el código actual: no hay Socket.IO, WebSockets, flujo OAuth, envío de emails ni links de verificación/recuperación de contraseña. No aplica.

---

## Verificación post-deploy

- `GET https://<backend>.onrender.com/api/products` responde 200 con `Origin` del frontend real.
- Un origen no listado en `CORS_ALLOWED_ORIGINS` recibe error de CORS (sin `Access-Control-Allow-Origin` en la respuesta).
- Login, carrito y checkout funcionan end-to-end contra el backend desplegado.
