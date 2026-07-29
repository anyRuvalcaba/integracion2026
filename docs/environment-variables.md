# Variables de entorno

Este documento describe toda la configuración dependiente del entorno del monorepo (`ecommerce-api` + `ecommerce-app`). Ninguna URL, dominio ni puerto de producción debe vivir hardcodeado en el código: todo pasa por estas variables.

---

## Backend — `ecommerce-api`

Leídas y validadas centralizadamente en `src/config/env.js` (se importa desde `server.js` y `src/config/db.conf.js`). `dotenv.config()` se llama una sola vez ahí.

| Variable | Obligatoria | Ejemplo local | Descripción |
|---|---|---|---|
| `NODE_ENV` | No (default `development`) | `development` | Controla qué variables son obligatorias. En `production` exige `FRONTEND_URL` y `CORS_ALLOWED_ORIGINS`. |
| `PORT` | No (default `4000`) | `4000` | Puerto de escucha. En Render lo asigna la plataforma. |
| `MONGODB_URI` | Sí | `mongodb://localhost:27017/ecommerce-db-mayo2026` | Cadena de conexión de Mongoose. |
| `FRONTEND_URL` | Sí en producción | `http://localhost:3000` | URL del frontend. Se usa como fallback de `CORS_ALLOWED_ORIGINS` si esta no está definida. |
| `CORS_ALLOWED_ORIGINS` | Sí en producción | `http://localhost:3000` | Lista de orígenes permitidos por CORS, separados por comas. Se recortan espacios y se ignoran vacíos. |
| `JWT_SECRET` | Sí | — | Secreto para firmar el access token. |
| `JWT_REFRESH_TOKEN` | Sí | — | Secreto para firmar el refresh token. |
| `JWT_EXPIRES_IN` | No | `1h` | Documentado por convención; el valor real de expiración del access token está hardcodeado (`"1h"`) en `authController.js`, no se lee esta variable en código. Preexistente, fuera del alcance de esta migración. |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Igual que arriba, con `"7d"` hardcodeado. |

Si falta `MONGODB_URI`, `JWT_SECRET` o `JWT_REFRESH_TOKEN` (en cualquier entorno), o `FRONTEND_URL`/`CORS_ALLOWED_ORIGINS` en producción, `src/config/env.js` lanza un error al arrancar y el proceso no levanta. No hay fallback silencioso a un valor de producción.

### Múltiples orígenes CORS

```env
CORS_ALLOWED_ORIGINS=https://mi-ecommerce.onrender.com,https://staging.mi-ecommerce.onrender.com
```

### Archivo local

`ecommerce-api/.env` (ignorado por git). Copiar desde `ecommerce-api/.env.example` y completar los secretos.

---

## Frontend — `ecommerce-app` (Create React App)

CRA solo expone al bundle las variables con prefijo `REACT_APP_`. Se incorporan durante el build (`npm run build` / `npm start`), no en runtime — cambiar el valor requiere reconstruir.

| Variable | Obligatoria | Ejemplo local | Descripción |
|---|---|---|---|
| `REACT_APP_API_URL` | Sí | `http://localhost:4000/api` | URL base de la API, **incluye** el prefijo `/api`. Leída una sola vez en `src/services/apiClient.js`, único cliente HTTP del frontend. Si falta, `apiClient.js` lanza `Error("Falta configurar REACT_APP_API_URL")` al importarse. |

### Archivos `.env` del frontend (convención CRA)

| Archivo | Versionado en git | Cuándo se usa |
|---|---|---|
| `.env.development` | Sí | `npm start` (desarrollo local). Contiene el valor real `http://localhost:4000/api`: no es un secreto ni una URL de producción, es el default de desarrollo compartido por el equipo. |
| `.env.test` | Sí | `npm test` / `npm run test:coverage`. La API está mockeada (`axios-mock-adapter`), el valor es dummy — solo existe para satisfacer la validación de `apiClient.js`. |
| `.env.example` | Sí | Plantilla documentada, sin secretos. |
| `.env.local` | No (gitignored) | Override local opcional, mayor precedencia que `.env.development`. |
| `.env.production` | No se versiona | En Render, `REACT_APP_API_URL` se define en las variables de entorno del servicio del frontend, no en un archivo — CRA las toma de `process.env` en build time sin necesitar `.env.production`. |

**Importante:** `npm run build` usa `NODE_ENV=production`, por lo que CRA **no lee `.env.development`** (ese archivo solo aplica a `npm start`). Si corrés `npm run build` en tu máquina sin `REACT_APP_API_URL` definida en el shell ni un `.env.production.local`, el bundle queda sin la URL embebida y `apiClient.js` truena en el navegador al cargar. Para probar un build de producción en local:

```bash
REACT_APP_API_URL=http://localhost:4000/api npm run build
```

o creá `.env.production.local` (gitignored) con esa misma línea. En Render esto no aplica porque la variable la define el dashboard directamente.

---

## Diferencias desarrollo vs. producción

| Aspecto | Desarrollo | Producción (Render) |
|---|---|---|
| Backend URL | `http://localhost:4000` | `https://<nombre-servicio>.onrender.com` |
| Frontend URL | `http://localhost:3000` | `https://<nombre-servicio>.onrender.com` |
| `NODE_ENV` (backend) | `development` (default) | `production` (obligatorio, activa validación estricta) |
| `CORS_ALLOWED_ORIGINS` | Opcional (cae a `FRONTEND_URL`) | Obligatoria, debe listar el dominio real del frontend |
| Puerto backend | `4000` (fijo) | Asignado por Render vía `PORT` |

---

## Procedimiento para agregar un nuevo origen permitido

1. Editar `CORS_ALLOWED_ORIGINS` en el servicio backend de Render (o en `.env` local), agregando el nuevo origen separado por coma.
2. Redeploy o reinicio del servicio backend (la validación de `src/config/env.js` corre al arrancar el proceso).
3. No se requiere cambio de código: `server.js` lee la lista dinámicamente desde `src/config/env.js`.
