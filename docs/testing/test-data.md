# Estrategia de datos de prueba

> Este proyecto tiene **tres** estrategias de datos de prueba que coexisten (backend, frontend, Cypress). No están unificadas en una sola fuente — este documento las hace explícitas y señala dónde ya coinciden y dónde no, sin forzar una unificación que requeriría tocar los tres niveles a la vez.

## Las tres fuentes

### 1. Backend — `ecommerce-api/src/__tests__/helpers/fixtures.js`
Factories: `createCustomer()`, `createAdmin()`, `createCategory()`, `createSubCategory()`, `createProduct()`. Generación de tokens: `tokenFor(user)` (válido, 1h), `expiredTokenFor(user)` (expirado, para probar rechazo). **No existen factories** de `Cart`, `Order`, `Address` ni `PaymentMethod` — cada archivo de integración los construye inline. Limpieza: `helpers/db.js` → `useTestDatabase()` hace `deleteMany({})` de todas las colecciones en `beforeEach`, contra una `mongodb-memory-server` propia por corrida (`globalSetup.js`).

### 2. Frontend (unit/integración) — `ecommerce-app/src/mocks/handlers.js` + `server.js`
`setupDefaultMocks(mock)` registra respuestas fijas sobre `axios-mock-adapter` (no MSW pese al nombre del archivo — ver `known-issues.md`). Fixtures exportadas: `TEST_TOKEN` (JWT falso, `alg: none`), `SAMPLE_PRODUCTS` (2 productos: uno con stock, uno sin stock), `SAMPLE_ADDRESS`, `SAMPLE_PAYMENT`. Reset: `beforeEach` en `setupTests.js` hace `mock.reset()` + vuelve a aplicar `setupDefaultMocks`.

### 3. E2E — `ecommerce-app/cypress/fixtures/` + `cypress/utils/testData.js`
`fixtures/products.json` (1 producto: Teclado Mecánico, $899, stock 10), `fixtures/users.json` (alice + admin con credenciales). `utils/testData.js` genera datos únicos: `uniqueEmail(prefix)`, `newUser(email)` (password fija `Test1234!`). Los datos reales de sesión vienen del **backend real** vía `npm run seed` (`ecommerce-api/src/seed/seed.js`) — Cypress no mockea nada, corre contra Mongo real.

## Dónde ya están alineadas

- `alice@ecommerce.com` / `password123` es el mismo usuario en: el seed real (`seed.js`), los mocks de frontend (`handlers.js` valida login contra ese email/password exacto), y `cypress/fixtures/users.json`. Si se cambia en un lado, hay que cambiarlo en los tres.
- El patrón de "producto con stock" vs "producto sin stock" existe tanto en `SAMPLE_PRODUCTS` (frontend) como en el seed real — aunque con datos distintos (no es el mismo producto exacto).

## Dónde no están alineadas

- El backend no tiene factories de `Cart`/`Order`/`Address`/`PaymentMethod` — cada test de integración arma el payload a mano, lo que genera repetición entre archivos.
- Los IDs y montos de `SAMPLE_PRODUCTS` (frontend) no corresponden a ningún producto real del seed — son puramente sintéticos para el nivel unitario, lo cual es correcto (no debería depender del backend real), pero vale la pena que quien escriba tests nuevos lo sepa para no asumir que coinciden.

## Tabla entidad → creación → limpieza → suites

| Entidad | Método de creación | Método de limpieza | Suites que la usan |
|---|---|---|---|
| Usuario válido / admin | `fixtures.js: createCustomer()/createAdmin()` (backend); `SAMPLE_*`/`TEST_TOKEN` (frontend); `fixtures/users.json` + seed real (Cypress) | `deleteMany` en `beforeEach` (backend); `mock.reset()` en `beforeEach` (frontend); persiste en Mongo real, no se limpia entre specs (Cypress, usa `cy.session()` para cachear) | Todos los archivos de integración backend; `LoginForm`/`RegisterForm`/`ProtectedRoute` (frontend); `login.cy.js`/`register.cy.js`/`checkout.cy.js` |
| Usuario duplicado | Payload con email ya existente, construido inline en cada test | N/A (no se persiste, se espera rechazo) | `auth.test.js` (backend, IT-AUTH-004); `RegisterForm.test.jsx`; `register.cy.js` |
| Producto disponible | `fixtures.js: createProduct()` (backend); `SAMPLE_PRODUCTS[0]` (frontend, con stock); `fixtures/products.json` + seed (Cypress) | `deleteMany` / `mock.reset()` | `products.test.js`, `cart.test.js`; `ProductCard.test.jsx`; `checkout.cy.js` |
| Producto sin inventario | Payload inline con `stock: 0` (backend); `SAMPLE_PRODUCTS[1]` (frontend) | igual que arriba | Tests de validación de cantidad en carrito |
| Producto eliminado | No hay factory dedicada — se crea y se borra inline donde se necesita (ej. `products.test.js` DELETE) | igual que arriba | `products.test.js` |
| Carrito con productos | Construido inline en cada test de integración de `cart.test.js`; en frontend vía mocks de `/cart*` | `deleteMany` / `mock.reset()` | `cart.test.js`; `CartContext.test.jsx`; `checkout.cy.js` |
| Orden válida | Construida inline en `orders.test.js`; mock de `POST /orders` en frontend (siempre 201 `pending`) | `deleteMany` / `mock.reset()` | `orders.test.js`; `Checkout.test.jsx`; `checkout.cy.js` |
| Orden fallida | No hay caso de mock explícito para orden fallida en frontend — solo se testea el 4xx a nivel backend (`orders.test.js`) | igual que arriba | `orders.test.js` |

## Nota para trabajo futuro (`TEST-XXX`)

Cualquier ítem del backlog que agregue tests de `Cart`/`Order`/`Address`/`PaymentMethod` en backend debería, de paso, extraer una factory a `fixtures.js` si el patrón se repite — no es obligatorio para cerrar un ítem individual, pero evita seguir acumulando payloads inline duplicados.
