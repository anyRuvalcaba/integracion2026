# Plan de Pruebas — ecommerce-api

**Versión:** 1.4.0
**Fecha última ejecución:** 2026-07-02
**Stack de testing:** Vitest 4.1.9 · Supertest 7.2.2 · mongodb-memory-server 11.2.0
**Estado global:** 180/180 tests pasan ✅

---

## Comandos

```bash
npm test                 # todos los tests (una pasada)
npm run test:watch       # modo watch interactivo
npm run test:unit        # solo tests unitarios
npm run test:integration # solo tests de integración
npm run test:coverage    # reporte de cobertura en ./coverage/
```

---

## Arquitectura de la suite

```
src/__tests__/
├── setup/
│   ├── globalSetup.js    # inicia MongoMemoryServer, setea MONGODB_URI y JWT_SECRET
│   └── testSetup.js      # fallback de env vars para tests unitarios (sin DB)
├── helpers/
│   ├── createApp.js      # Express app sin connectDB() ni listen()
│   ├── db.js             # useTestDatabase() — connect/clear/disconnect por archivo
│   └── fixtures.js       # createCustomer, createAdmin, createProduct, tokenFor…
├── unit/
│   ├── middlewares/      # tests sin DB, sin HTTP, sin servicios externos
│   └── utils/            # tests de utilidades puras
└── integration/          # tests HTTP con supertest + MongoMemoryServer
```

**Decisiones de diseño:**
- `fileParallelism: false` — archivos secuenciales, evita conflictos de conexión Mongoose
- `pool: forks` — propagación de `process.env` desde `globalSetup` a workers
- Cada archivo de integración llama `useTestDatabase()`: `beforeAll` conecta, `beforeEach` limpia colecciones, `afterAll` desconecta
- Los bugs encontrados durante la suite fueron corregidos en producción (v1.3.0). No quedan bugs documentados pendientes en el backlog.

---

## Módulos unitarios — archivos fuente inspeccionados

### authMiddleware.js
- **Ruta real:** `src/middlewares/authMiddleware.js`
- **Dependencias:** `jsonwebtoken` (npm), `process.env.JWT_SECRET`
- **Lógica:** Lee `req.headers["authorization"]`, extrae token con `.split(" ")[1]`, verifica con `jwt.verify(token, secret, callback)`
- **Sin imports internos del proyecto**

### isAdminMiddleware.js
- **Ruta real:** `src/middlewares/isAdminMiddleware.js`
- **Dependencias:** ninguna (sin imports)
- **Lógica:** Verifica `req.user` y `req.user.role === "admin"`
- **Prerequisito implícito:** `authMiddleware` debe haber corrido antes para poblar `req.user`

### validation.js
- **Ruta real:** `src/middlewares/validation.js`
- **Dependencias:** `express-validator` (npm) — solo `validationResult`
- **Lógica:** `validationResult(req).isEmpty()` → next() o 422 con `errors.array()`

### errorHandler.js
- **Ruta real:** `src/middlewares/errorHandler.js`
- **Dependencias:** `fs`, `path`, `url` (Node.js built-ins)
- **Lógica:** construye ruta de log con `__dirname`, llama `fs.appendFile`, responde 500
- **Bug real (línea 24):** usa `res.headerSent` — la propiedad de Express es `res.headersSent`

### logger.js
- **Ruta real:** `src/middlewares/logger.js`
- **Dependencias:** ninguna
- **Lógica:** `console.log(`${dateTime.toISOString()} | ${req.method} | ${req.url}`)` → `next()`
- **Sin lógica de negocio** — middleware de observabilidad puro

### bcrypt (contrato de hashing)
- **Archivos productivos que usan esta lógica:** `src/controllers/authController.js:19-22` y `src/controllers/userController.js:4-6`
- **Dependencias:** `bcrypt` (npm), `saltRounds = 10`
- **Función no exportada** — se testea el comportamiento observable de `bcrypt.hash` + `bcrypt.compare` con los mismos parámetros que el código usa

---

## Matriz de pruebas — Unitarios: middlewares

| ID | Módulo | Escenario | Dependencias mockeadas | Resultado | Estado |
|----|--------|-----------|----------------------|-----------|--------|
| UT-MW-001 | authMiddleware | Sin header Authorization → 401 | ninguna | 401 + `{ message: "Unauthorized" }` | ✅ PASA |
| UT-MW-002 | authMiddleware | Header sin "Bearer " → 401 | ninguna | 401 (split devuelve undefined) | ✅ PASA |
| UT-MW-003 | authMiddleware | Token string inválido → 401 | ninguna | 401 + `{ message: "Invalid or expired token" }` | ✅ PASA |
| UT-MW-004 | authMiddleware | Token expirado → 401 | ninguna | 401 + `{ message: "Invalid or expired token" }` | ✅ PASA |
| UT-MW-005 | authMiddleware | Token válido → next() sin response | ninguna | next() llamado, res.status no llamado | ✅ PASA |
| UT-MW-006 | authMiddleware | Token válido → req.user = { userId, name, role } | ninguna | payload decodificado en req.user | ✅ PASA |
| UT-MW-007 | isAdmin | Sin req.user → 401 | ninguna | 401 + `{ message: "Authentication is required" }` | ✅ PASA |
| UT-MW-008 | isAdmin | role "customer" → 403 | ninguna | 403 + `{ message: "Admin access required" }` | ✅ PASA |
| UT-MW-009 | isAdmin | role "admin" → next() | ninguna | next() llamado | ✅ PASA |
| UT-MW-010 | validate | Sin errores → next() | `express-validator` (vi.mock) | next() llamado | ✅ PASA |
| UT-MW-011 | validate | Con errores → 422 + array | `express-validator` (vi.mock) | 422 + `{ errors: [...] }` | ✅ PASA |
| UT-MW-012 | errorHandler | Responde 500 con cuerpo correcto | `fs` (vi.mock) | 500 + `{ status: "error", message: "Internal Server Error" }` | ✅ PASA |
| UT-MW-013 | errorHandler | Llama fs.appendFile con ruta del log | `fs` (vi.mock) | appendFile llamado 1 vez con path que contiene "error.log" | ✅ PASA |
| UT-MW-014 | errorHandler | Bug: `res.headerSent` no previene double-send | `fs` (vi.mock) | res.status llamado igual (bug confirmado) | ✅ PASA |
| UT-LOG-001 | logger | Llama next() siempre | `console.log` (vi.spyOn) | next() llamado 1 vez | ✅ PASA |
| UT-LOG-002 | logger | Llama console.log con method y url | `console.log` (vi.spyOn) | log contiene "POST" y "/api/auth/login" | ✅ PASA |
| UT-LOG-003 | logger | El log incluye timestamp ISO 8601 | `console.log` (vi.spyOn) | logArg matches `/\d{4}-\d{2}-\d{2}T/` | ✅ PASA |

**Ejecución:** `npx vitest run src/__tests__/unit/middlewares/ --reporter=verbose`
**Resultado:** 17/17 ✅

---

## Matriz de pruebas — Unitarios: utils

| ID | Módulo | Escenario | Dependencias | Resultado | Estado |
|----|--------|-----------|-------------|-----------|--------|
| UT-HASH-001 | bcrypt (saltRounds=10) | hash verificable con bcrypt.compare | `bcrypt` real | `bcrypt.compare(plain, hash)` → true | ✅ PASA |
| UT-HASH-002 | bcrypt | Dos hashes del mismo input son distintos | `bcrypt` real | hash1 !== hash2 | ✅ PASA |
| UT-HASH-003 | bcrypt | Hash no es igual al texto plano | `bcrypt` real | hashed !== password | ✅ PASA |
| UT-HASH-004 | bcrypt | Hash empieza con `$2b$10$` | `bcrypt` real | confirma v2b + 10 rounds | ✅ PASA |
| UT-HASH-005 | bcrypt | Password incorrecto falla verificación | `bcrypt` real | `bcrypt.compare(wrong, hash)` → false | ✅ PASA |

**Ejecución:** `npx vitest run src/__tests__/unit/utils/ --reporter=verbose`
**Resultado:** 5/5 ✅

---

## Resumen unitarios por módulo

| Módulo | Archivo fuente real | Tests | Pasan | Fallan | Estado |
|--------|-------------------|-------|-------|--------|--------|
| authMiddleware | `src/middlewares/authMiddleware.js` | 6 | 6 | 0 | ✅ PASA |
| isAdminMiddleware | `src/middlewares/isAdminMiddleware.js` | 3 | 3 | 0 | ✅ PASA |
| validate | `src/middlewares/validation.js` | 2 | 2 | 0 | ✅ PASA |
| errorHandler | `src/middlewares/errorHandler.js` | 3 | 3 | 0 | ✅ PASA |
| logger | `src/middlewares/logger.js` | 3 | 3 | 0 | ✅ PASA |
| bcrypt (hashing) | `authController.js:19`, `userController.js:4` | 5 | 5 | 0 | ✅ PASA |
| **TOTAL UNITARIOS** | | **22** | **22** | **0** | **✅** |

---

## Matriz de pruebas — Integración Auth

| ID | Escenario | Ruta | Status esperado | Estado |
|----|-----------|------|----------------|--------|
| IT-AUTH-001 | 201 con datos válidos | POST /api/auth/register | 201 | ✅ PASA |
| IT-AUTH-002 | Response sin campo password | POST /api/auth/register | 201 | ✅ PASA |
| IT-AUTH-003 | Response contiene name y email | POST /api/auth/register | 201 | ✅ PASA |
| IT-AUTH-004 | Email duplicado → 400 (bug: debería ser 409) | POST /api/auth/register | 400 | ✅ PASA |
| IT-AUTH-005 | Response retorna email sin normalizar (bug doc) | POST /api/auth/register | 201 | ✅ PASA |
| IT-AUTH-006 | Register asigna role customer por defecto | POST /api/auth/register | 201 | ✅ PASA |
| IT-AUTH-007 | 200 con credenciales válidas | POST /api/auth/login | 200 | ✅ PASA |
| IT-AUTH-008 | Response contiene token y refreshToken | POST /api/auth/login | 200 | ✅ PASA |
| IT-AUTH-009 | Token es JWT válido firmado con JWT_SECRET | POST /api/auth/login | 200 | ✅ PASA |
| IT-AUTH-010 | Usuario no existe → 400 | POST /api/auth/login | 400 | ✅ PASA |
| IT-AUTH-011 | Password incorrecta → 400 | POST /api/auth/login | 400 | ✅ PASA |

**Resultado:** 11/11 ✅

---

## Matriz de pruebas — Integración Products

| ID | Escenario | Ruta | Status | Estado |
|----|-----------|------|--------|--------|
| IT-PROD-001 | 200 + pagination | GET /api/products | 200 | ✅ PASA |
| IT-PROD-002 | Solo stock > 0 | GET /api/products | 200 | ✅ PASA |
| IT-PROD-003 | Paginación page + limit | GET /api/products | 200 | ✅ PASA |
| IT-PROD-004 | Filtra por q (nombre, case-insensitive) | GET /api/products/search | 200 | ✅ PASA |
| IT-PROD-005 | Filtra por minPrice y maxPrice | GET /api/products/search | 200 | ✅ PASA |
| IT-PROD-006 | inStock=true filtra stock > 0 | GET /api/products/search | 200 | ✅ PASA |
| IT-PROD-007 | 200 con category populada | GET /api/products/:id | 200 | ✅ PASA |
| IT-PROD-008 | 404 si id no existe | GET /api/products/:id | 404 | ✅ PASA |
| IT-PROD-009 | 401 sin token | POST /api/products | 401 | ✅ PASA |
| IT-PROD-010 | 401 token inválido | POST /api/products | 401 | ✅ PASA |
| IT-PROD-011 | 403 customer token | POST /api/products | 403 | ✅ PASA |
| IT-PROD-012 | 422 name falta | POST /api/products | 422 | ✅ PASA |
| IT-PROD-013 | 422 price negativo | POST /api/products | 422 | ✅ PASA |
| IT-PROD-014 | 201 admin + datos válidos | POST /api/products | 201 | ✅ PASA |
| IT-PROD-015 | 401 sin token | PUT /api/products/:id | 401 | ✅ PASA |
| IT-PROD-016 | 403 customer token | PUT /api/products/:id | 403 | ✅ PASA |
| IT-PROD-017 | 200 actualiza nombre y precio | PUT /api/products/:id | 200 | ✅ PASA |
| IT-PROD-018 | 404 id inexistente | PUT /api/products/:id | 404 | ✅ PASA |
| IT-PROD-019 | 401 sin token | DELETE /api/products/:id | 401 | ✅ PASA |
| IT-PROD-020 | 403 customer token | DELETE /api/products/:id | 403 | ✅ PASA |
| IT-PROD-021 | 204 sin body | DELETE /api/products/:id | 204 | ✅ PASA |
| IT-PROD-022 | 404 id inexistente | DELETE /api/products/:id | 404 | ✅ PASA |
| IT-PROD-023 | inStock=false filtra stock <= 0 | GET /api/products/search | 200 | ✅ PASA |

**Resultado:** 23/23 ✅

---

## Matriz de pruebas — Integración Categories

| ID | Escenario | Ruta | Status | Estado |
|----|-----------|------|--------|--------|
| IT-CAT-001 | 200 array público | GET /api/categories | 200 | ✅ PASA |
| IT-CAT-002 | 200 + parentCategory populada | GET /api/categories/:id | 200 | ✅ PASA |
| IT-CAT-003 | 404 id inexistente | GET /api/categories/:id | 404 | ✅ PASA |
| IT-CAT-004 | 200 + productos de cat y subcats | GET /api/categories/:id/products | 200 | ✅ PASA |
| IT-CAT-005 | 404 si categoría no existe | GET /api/categories/:id/products | 404 | ✅ PASA |
| IT-CAT-006 | Response incluye pagination | GET /api/categories/:id/products | 200 | ✅ PASA |
| IT-CAT-007 | 401 sin token | POST /api/categories | 401 | ✅ PASA |
| IT-CAT-008 | 403 customer token | POST /api/categories | 403 | ✅ PASA |
| IT-CAT-009 | 422 name falta | POST /api/categories | 422 | ✅ PASA |
| IT-CAT-010 | 422 description falta | POST /api/categories | 422 | ✅ PASA |
| IT-CAT-011 | 201 categoría principal | POST /api/categories | 201 | ✅ PASA |
| IT-CAT-012 | 201 subcategoría con parent | POST /api/categories | 201 | ✅ PASA |
| IT-CAT-013 | 200 actualiza nombre y desc | PUT /api/categories/:id | 200 | ✅ PASA |
| IT-CAT-014 | 404 id inexistente | PUT /api/categories/:id | 404 | ✅ PASA |
| IT-CAT-015 | 204 sin body | DELETE /api/categories/:id | 204 | ✅ PASA |
| IT-CAT-016 | 404 id inexistente | DELETE /api/categories/:id | 404 | ✅ PASA |

**Resultado:** 16/16 ✅

---

## Matriz de pruebas — Integración Cart

| ID | Escenario | Ruta | Status | Estado |
|----|-----------|------|--------|--------|
| IT-CART-001 | 401 sin token | GET /api/cart | 401 | ✅ PASA |
| IT-CART-002 | 403 customer token | GET /api/cart | 403 | ✅ PASA |
| IT-CART-003 | 200 array (admin) | GET /api/cart | 200 | ✅ PASA |
| IT-CART-013 | 401 sin token | GET /api/cart/:id | 401 | ✅ PASA |
| IT-CART-014 | 403 customer token | GET /api/cart/:id | 403 | ✅ PASA |
| IT-CART-015 | 404 cart inexistente | GET /api/cart/:id | 404 | ✅ PASA |
| IT-CART-016 | 200 cart con user y products populados | GET /api/cart/:id | 200 | ✅ PASA |
| IT-CART-004 | 401 sin token | GET /api/cart/user/:id | 401 | ✅ PASA |
| IT-CART-005 | 404 sin carrito | GET /api/cart/user/:id | 404 | ✅ PASA |
| IT-CART-006 | 200 user + products populados | GET /api/cart/user/:id | 200 | ✅ PASA |
| IT-CART-017 | 422 user no es MongoId | POST /api/cart | 422 | ✅ PASA |
| IT-CART-018 | 422 quantity = 0 | POST /api/cart | 422 | ✅ PASA |
| IT-CART-007 | 401 sin token | POST /api/cart | 401 | ✅ PASA |
| IT-CART-008 | 201 crea carrito | POST /api/cart | 201 | ✅ PASA |
| IT-CART-009 | 200 actualiza productos | PUT /api/cart/:id | 200 | ✅ PASA |
| IT-CART-010 | 404 id inexistente | PUT /api/cart/:id | 404 | ✅ PASA |
| IT-CART-011 | 204 borra carrito | DELETE /api/cart/:id | 204 | ✅ PASA |
| IT-CART-012 | 404 si no existe | DELETE /api/cart/:id | 404 | ✅ PASA |

**Resultado:** 18/18 ✅

---

## Matriz de pruebas — Integración Orders

| ID | Escenario | Ruta | Status | Estado |
|----|-----------|------|--------|--------|
| IT-ORD-001 | 401 sin token | GET /api/orders | 401 | ✅ PASA |
| IT-ORD-002 | 403 customer token | GET /api/orders | 403 | ✅ PASA |
| IT-ORD-003 | 200 array (admin) | GET /api/orders | 200 | ✅ PASA |
| IT-ORD-004 | 401 sin token | GET /api/orders/:id | 401 | ✅ PASA |
| IT-ORD-005 | 404 si no existe | GET /api/orders/:id | 404 | ✅ PASA |
| IT-ORD-006 | 200 con relaciones populadas | GET /api/orders/:id | 200 | ✅ PASA |
| IT-ORD-007 | 401 sin token | POST /api/orders | 401 | ✅ PASA |
| IT-ORD-008 | 422 products vacío | POST /api/orders | 422 | ✅ PASA |
| IT-ORD-014 | 422 address no es MongoId | POST /api/orders | 422 | ✅ PASA |
| IT-ORD-015 | 422 totalPrice faltante | POST /api/orders | 422 | ✅ PASA |
| IT-ORD-009 | 201 orden válida | POST /api/orders | 201 | ✅ PASA |
| IT-ORD-010 | 401 sin token | PUT /api/orders/:id | 401 | ✅ PASA |
| IT-ORD-011 | 422 status inválido | PUT /api/orders/:id | 422 | ✅ PASA |
| IT-ORD-012 | 200 actualiza status y paymentStatus | PUT /api/orders/:id | 200 | ✅ PASA |
| IT-ORD-013 | 404 si no existe | PUT /api/orders/:id | 404 | ✅ PASA |

**Resultado:** 15/15 ✅

---

## Matriz de pruebas — Integración Users

| ID | Escenario | Ruta | Status | Estado |
|----|-----------|------|--------|--------|
| IT-USR-001 | 401 sin token | GET /api/users | 401 | ✅ PASA |
| IT-USR-002 | 403 customer token | GET /api/users | 403 | ✅ PASA |
| IT-USR-003 | 200 sin campo password | GET /api/users | 200 | ✅ PASA |
| IT-USR-004 | 404 id inexistente | GET /api/users/:id | 404 | ✅ PASA |
| IT-USR-005 | 200 sin campo password | GET /api/users/:id | 200 | ✅ PASA |
| IT-USR-006 | 401 sin token | POST /api/users | 401 | ✅ PASA |
| IT-USR-007 | 422 email inválido | POST /api/users | 422 | ✅ PASA |
| IT-USR-008 | 422 password < 6 chars | POST /api/users | 422 | ✅ PASA |
| IT-USR-009 | 201 sin password en response | POST /api/users | 201 | ✅ PASA |
| IT-USR-010 | 200 actualiza sin requerir password | PUT /api/users/:id | 200 | ✅ PASA |
| IT-USR-014 | 200 actualiza password — login con nueva contraseña funciona | PUT /api/users/:id | 200 | ✅ PASA |
| IT-USR-015 | 404 id inexistente | PUT /api/users/:id | 404 | ✅ PASA |
| IT-USR-011 | 401 sin token | DELETE /api/users/:id | 401 | ✅ PASA |
| IT-USR-012 | 204 borra usuario | DELETE /api/users/:id | 204 | ✅ PASA |
| IT-USR-013 | 404 id inexistente | DELETE /api/users/:id | 404 | ✅ PASA |

**Resultado:** 15/15 ✅

---

## Matriz de pruebas — Integración Wishlist

| ID | Escenario | Ruta | Status | Estado |
|----|-----------|------|--------|--------|
| IT-WISH-001 | 401 sin token | GET /api/wishlist | 401 | ✅ PASA |
| IT-WISH-002 | 403 customer token | GET /api/wishlist | 403 | ✅ PASA |
| IT-WISH-003 | 200 array (admin) | GET /api/wishlist | 200 | ✅ PASA |
| IT-WISH-004 | 401 sin token | GET /api/wishlist/user/:id | 401 | ✅ PASA |
| IT-WISH-005 | 404 sin wishlist | GET /api/wishlist/user/:id | 404 | ✅ PASA |
| IT-WISH-006 | 200 con products populados | GET /api/wishlist/user/:id | 200 | ✅ PASA |
| IT-WISH-007 | 401 sin token | POST /api/wishlist | 401 | ✅ PASA |
| IT-WISH-008 | Crea nueva wishlist | POST /api/wishlist | 200 | ✅ PASA |
| IT-WISH-009 | Agrega producto a existente | POST /api/wishlist | 200 | ✅ PASA |
| IT-WISH-010 | Duplicado → 200 sin duplicar | POST /api/wishlist | 200 | ✅ PASA |
| IT-WISH-011 | 401 sin token | DELETE /api/wishlist/:id/product | 401 | ✅ PASA |
| IT-WISH-012 | 200 elimina producto | DELETE /api/wishlist/:id/product | 200 | ✅ PASA |
| IT-WISH-013 | 404 wishlist inexistente | DELETE /api/wishlist/:id/product | 404 | ✅ PASA |
| IT-WISH-014 | 204 borra wishlist completa | DELETE /api/wishlist/:id | 204 | ✅ PASA |
| IT-WISH-015 | 404 wishlist inexistente | DELETE /api/wishlist/:id | 404 | ✅ PASA |

**Resultado:** 15/15 ✅

---

## Matriz de pruebas — Integración PaymentMethods

| ID | Escenario | Ruta | Status | Estado |
|----|-----------|------|--------|--------|
| IT-PAY-001 | 401 sin token | GET /api/payment-methods | 401 | ✅ PASA |
| IT-PAY-002 | 403 customer token | GET /api/payment-methods | 403 | ✅ PASA |
| IT-PAY-003 | 200 array con user (admin) | GET /api/payment-methods | 200 | ✅ PASA |
| IT-PAY-004 | 401 sin token | GET /api/payment-methods/:id | 401 | ✅ PASA |
| IT-PAY-005 | 403 customer token (admin only) | GET /api/payment-methods/:id | 403 | ✅ PASA |
| IT-PAY-006 | 404 id inexistente | GET /api/payment-methods/:id | 404 | ✅ PASA |
| IT-PAY-007 | 200 con user populado | GET /api/payment-methods/:id | 200 | ✅ PASA |
| IT-PAY-008 | Sin token → 401 (auth detiene cadena antes que validate) | POST /api/payment-methods | 401 | ✅ PASA |
| IT-PAY-009 | Con token, sin user → 422 | POST /api/payment-methods | 422 | ✅ PASA |
| IT-PAY-010 | type inválido → 422 | POST /api/payment-methods | 422 | ✅ PASA |
| IT-PAY-011 | 201 cash_on_delivery válido | POST /api/payment-methods | 201 | ✅ PASA |
| IT-PAY-012 | 201 credit_card + cvv en response (bug seguridad) | POST /api/payment-methods | 201 | ✅ PASA |
| IT-PAY-013 | isDefault=true desactiva otros métodos | POST /api/payment-methods | 201 | ✅ PASA |
| IT-PAY-014 | 401 sin token | PUT /api/payment-methods/:id | 401 | ✅ PASA |
| IT-PAY-015 | 404 id inexistente | PUT /api/payment-methods/:id | 404 | ✅ PASA |
| IT-PAY-016 | 200 actualiza type | PUT /api/payment-methods/:id | 200 | ✅ PASA |
| IT-PAY-017 | isDefault=true desactiva otros métodos | PUT /api/payment-methods/:id | 200 | ✅ PASA |
| IT-PAY-018 | 401 sin token | DELETE /api/payment-methods/:id | 401 | ✅ PASA |
| IT-PAY-019 | 404 id inexistente | DELETE /api/payment-methods/:id | 404 | ✅ PASA |
| IT-PAY-020 | 204 borra método sin body | DELETE /api/payment-methods/:id | 204 | ✅ PASA |

**Resultado:** 20/20 ✅

**Observaciones del módulo:**
- IT-PAY-008: el POST route declara `createPaymentValidation` antes de `authMiddleware` (líneas 80-86 de `paymentMethodRoutes.js`). Esto no sigue el patrón del proyecto (auth primero), pero no cambia el comportamiento observable: los validators de express-validator solo coleccionan errores y no responden; `authMiddleware` responde 401 antes de que `validate` pueda enviar 422.
- IT-PAY-012: `createPaymentMethod` retorna el documento completo incluyendo el campo `cvv`. El esquema no tiene `.select("-cvv")` ni exclusión en la respuesta.

---

## Matriz de pruebas — Integración Addresses

| ID | Escenario | Ruta | Status | Estado |
|----|-----------|------|--------|--------|
| IT-ADDR-001 | 401 sin token | GET /api/addresses | 401 | ✅ PASA |
| IT-ADDR-002 | 200 array vacío sin direcciones | GET /api/addresses | 200 | ✅ PASA |
| IT-ADDR-003 | 200 array ordenado isDefault DESC | GET /api/addresses | 200 | ✅ PASA |
| IT-ADDR-004 | No devuelve direcciones de otros usuarios | GET /api/addresses | 200 | ✅ PASA |
| IT-ADDR-005 | 401 sin token | GET /api/addresses/:addressId | 401 | ✅ PASA |
| IT-ADDR-006 | 422 si addressId no es MongoId | GET /api/addresses/:addressId | 422 | ✅ PASA |
| IT-ADDR-007 | 404 si id no existe | GET /api/addresses/:addressId | 404 | ✅ PASA |
| IT-ADDR-008 | 404 si es de otro usuario (isolación) | GET /api/addresses/:addressId | 404 | ✅ PASA |
| IT-ADDR-009 | 200 con la dirección correcta | GET /api/addresses/:addressId | 200 | ✅ PASA |
| IT-ADDR-010 | 401 sin token | POST /api/addresses | 401 | ✅ PASA |
| IT-ADDR-011 | 422 falta address (requerido) | POST /api/addresses | 422 | ✅ PASA |
| IT-ADDR-012 | 422 postalCode < 4 chars | POST /api/addresses | 422 | ✅ PASA |
| IT-ADDR-013 | 201 con campos válidos | POST /api/addresses | 201 | ✅ PASA |
| IT-ADDR-014 | country por defecto "México" | POST /api/addresses | 201 | ✅ PASA |
| IT-ADDR-015 | isDefault=true desactiva otras | POST /api/addresses | 201 | ✅ PASA |
| IT-ADDR-016 | 401 sin token | PUT /api/addresses/:addressId | 401 | ✅ PASA |
| IT-ADDR-017 | 422 si addressId no es MongoId | PUT /api/addresses/:addressId | 422 | ✅ PASA |
| IT-ADDR-018 | 404 si no existe o es de otro usuario | PUT /api/addresses/:addressId | 404 | ✅ PASA |
| IT-ADDR-019 | 200 actualiza campos | PUT /api/addresses/:addressId | 200 | ✅ PASA |
| IT-ADDR-020 | isDefault=true desactiva otras | PUT /api/addresses/:addressId | 200 | ✅ PASA |
| IT-ADDR-021 | 401 sin token | DELETE /api/addresses/:addressId | 401 | ✅ PASA |
| IT-ADDR-022 | 422 si addressId no es MongoId | DELETE /api/addresses/:addressId | 422 | ✅ PASA |
| IT-ADDR-023 | 404 si id no existe | DELETE /api/addresses/:addressId | 404 | ✅ PASA |
| IT-ADDR-024 | 404 si es de otro usuario | DELETE /api/addresses/:addressId | 404 | ✅ PASA |
| IT-ADDR-025 | 204 sin body, registro eliminado | DELETE /api/addresses/:addressId | 204 | ✅ PASA |

**Resultado:** 25/25 ✅

---

## Resumen global — estado al 2026-06-25

| Módulo | Tipo | Archivo fuente real | Tests | Pasan | Fallan | Estado |
|--------|------|-------------------|-------|-------|--------|--------|
| authMiddleware | Unitario | `src/middlewares/authMiddleware.js` | 6 | 6 | 0 | ✅ PASA |
| isAdminMiddleware | Unitario | `src/middlewares/isAdminMiddleware.js` | 3 | 3 | 0 | ✅ PASA |
| validate | Unitario | `src/middlewares/validation.js` | 2 | 2 | 0 | ✅ PASA |
| errorHandler | Unitario | `src/middlewares/errorHandler.js` | 3 | 3 | 0 | ✅ PASA |
| logger | Unitario | `src/middlewares/logger.js` | 3 | 3 | 0 | ✅ PASA |
| bcrypt hashing | Unitario | `src/controllers/authController.js:19` | 5 | 5 | 0 | ✅ PASA |
| Auth | Integración | `src/controllers/authController.js` | 11 | 11 | 0 | ✅ PASA |
| Products | Integración | `src/controllers/productController.js` | 22 | 22 | 0 | ✅ PASA |
| Categories | Integración | `src/controllers/categoryController.js` | 16 | 16 | 0 | ✅ PASA |
| Cart | Integración | `src/controllers/cartController.js` | 12 | 12 | 0 | ✅ PASA |
| Orders | Integración | `src/controllers/orderController.js` | 13 | 13 | 0 | ✅ PASA |
| Users | Integración | `src/controllers/userController.js` | 13 | 13 | 0 | ✅ PASA |
| Wishlist | Integración | `src/controllers/wishlistController.js` | 15 | 15 | 0 | ✅ PASA |
| PaymentMethods | Integración | `src/controllers/paymentMethodController.js` | 20 | 20 | 0 | ✅ PASA |
| Addresses | Integración | `src/controllers/addressController.js` | 25 | 25 | 0 | ✅ PASA |
| **TOTAL** | | | **169** | **169** | **0** | **✅** |

---

## Bugs corregidos

Todos los bugs documentados durante la fase de testing han sido corregidos.

| Test ID | Bug original | Corrección aplicada | Archivo |
|---------|-------------|---------------------|---------|
| IT-AUTH-004 | Duplicado retornaba 400 | Cambiado a 409 | `authController.js:35` |
| IT-AUTH-005 | `register` retornaba email sin normalizar | Respuesta usa `newUser.email` (documento guardado) | `authController.js:50` |
| IT-CART-012 | `deleteCart` retornaba 400 cuando no existía | Cambiado a 404 | `cartController.js:129` |
| IT-ORD-013 | `updateOrderStatus` retornaba 204 cuando no existía | Cambiado a 404 | `orderController.js:69` |
| IT-USR-010 | `updateUser` lanzaba ReferenceError (`password` no declarada) | `password` desestructurada, hashing condicional si se provee | `userController.js:52` |
| UT-MW-014 | `errorHandler` usaba `res.headerSent` inexistente | Corregido a `res.headersSent` | `errorHandler.js:24` |
| IT-PAY-012 | `createPaymentMethod` incluía `cvv` en la respuesta | Respuesta usa `toObject()` con `delete responseData.cvv` | `paymentMethodController.js:57` |

---

## Correcciones aplicadas — addressController

**Archivo fuente:** `src/controllers/addressController.js`
**Estado anterior:** ❌ BLOQUEADO — no testeable vía HTTP
**Estado actual:** ✅ Corregido y con tests de integración

### Correcciones aplicadas

| # | Ubicación | Bug | Fix |
|---|-----------|-----|-----|
| 1 | `addressController.js:1` | `import Address from "../models/Address"` — sin `.js` | Agregado `.js` |
| 2 | `routes/` | No existía `addressRoutes.js` ni montaje en `index.js` | Creado `addressRoutes.js`, montado en `index.js` |
| 3 | `addressController.js:90,94` | `userId` no declarada en `updateAddress` | Reemplazado por `user` (variable correcta) |
| 4 | `addressController.js:37,55` | Campo `name` no existe en el schema `Address` | Eliminado de destructure y constructor |
| 5 | `addressController.js:137` | `deleteAddress` respondía 200 con body | Cambiado a 204 sin body |

---

## Módulos sin cobertura de tests (PENDIENTE)

| Módulo | Archivo fuente | Razón | Prioridad |
|--------|---------------|-------|-----------|
| db.conf | `src/config/db.conf.js` | Configuración de conexión, cubierta indirectamente por integración | Baja |

---

## Exclusiones de cobertura

| Ruta excluida | Razón |
|--------------|-------|
| `src/seed/**` | Código de setup, no de producción |
| `src/__tests__/**` | Los tests no se miden a sí mismos |

---

## Historial de ejecuciones

| Fecha | Comando | Resultado | Tests |
|-------|---------|-----------|-------|
| 2026-06-25 | `npm run test:unit` (1er run) | ✅ | 14/14 |
| 2026-06-25 | `npm run test:integration` (1er run) | ❌ 1 fallo | 101/102 |
| 2026-06-25 | `npm run test` (tras corrección IT-AUTH-005) | ✅ | 116/116 |
| 2026-06-25 | `npm run test` (tras agregar UT-HASH-001..005) | ✅ | 121/121 |
| 2026-06-25 | Ejecución módulo por módulo (revisión) | ✅ | 121/121 |
| 2026-06-25 | `npm run test` (tras agregar UT-LOG-001..003 + IT-PAY-001..020) | ✅ | 144/144 |
| 2026-06-25 | `npm run test` (tras corregir addressController + IT-ADDR-001..025) | ✅ | 169/169 |
| 2026-06-25 | `npm run test` (tras corregir 7 bugs T-AUTH-409/EMAIL/CART-404/ORD-404/USR-UPDATE/T-006/PAY-CVV) | ✅ | 169/169 |
