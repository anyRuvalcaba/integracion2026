# Cómo correr las pruebas

> `ecommerce-api` y `ecommerce-app` tienen `package.json` separados — no hay un `package.json` raíz (ver `TEST-019` en `docs/backlog.md` para la discusión de si conviene agregar uno). Cada comando de abajo indica desde qué carpeta correrlo.

## Backend — `ecommerce-api/`

```bash
cd ecommerce-api

npm test                    # suite completa (180 tests) — Vitest
npm run test:watch          # modo watch
npm run test:unit           # solo src/__tests__/unit
npm run test:integration    # solo src/__tests__/integration
npm run test:coverage       # suite completa + reporte de cobertura (text/html/lcov en ./coverage)
```

No hay script de `lint` ni `type check` — el proyecto es JS puro sin TypeScript ni ESLint configurado.

## Frontend — `ecommerce-app/`

```bash
cd ecommerce-app

npm test                    # modo watch (Jest vía react-scripts)
npm run test:run            # una sola corrida, sin watch (52 tests)
npm run test:coverage       # una sola corrida + cobertura (sin thresholds configurados aún, ver TEST-014)
```

### E2E (Cypress) — requiere backend real corriendo

```bash
# Terminal 1 — backend con datos de seed
cd ecommerce-api
npm run seed
npm run dev

# Terminal 2 — frontend + Cypress
cd ecommerce-app
npm run cypress:open        # modo interactivo
npm run cypress:run         # headless
npm run test:e2e            # alias de cypress:run
npm run test:e2e:headed     # headless con navegador visible
npm run test:all            # levanta el frontend automáticamente (start-server-and-test) + corre Cypress
```

Requiere `ecommerce-app/cypress.env.json` (gitignored) con:
```json
{
  "TEST_USER_EMAIL": "alice@ecommerce.com",
  "TEST_USER_PASSWORD": "password123",
  "TEST_ADMIN_EMAIL": "admin@ecommerce.com",
  "TEST_ADMIN_PASSWORD": "admin123",
  "TEST_PRODUCT_ID": "<id real de un producto tras correr npm run seed>"
}
```
En CI, solo `TEST_USER_EMAIL`/`TEST_USER_PASSWORD` se pasan como `CYPRESS_TEST_USER_EMAIL`/`CYPRESS_TEST_USER_PASSWORD` (ver `.github/workflows/frontend-tests.yml`) — `TEST_ADMIN_EMAIL`, `TEST_ADMIN_PASSWORD` y `TEST_PRODUCT_ID` no están wireados en el workflow todavía; los specs que los necesiten fallarán en CI hasta que se agreguen como secrets.

## Todo junto (sin CI)

```bash
# Backend
cd ecommerce-api && npm test

# Frontend unitario
cd ecommerce-app && npm run test:run

# E2E (con backend corriendo en otra terminal, ver arriba)
cd ecommerce-app && npm run test:all
```

## CI (GitHub Actions)

- `.github/workflows/frontend-tests.yml` — corre en push/PR que tocan `ecommerce-app/**`. Jobs: `unit-tests` (Jest+RTL, sube reporte de cobertura), `e2e-tests` (levanta backend real + Cypress).
- `.github/workflows/backend-tests.yml` — corre en push/PR que tocan `ecommerce-api/**`. Job único: `npm ci && npm run test:coverage` (usa `mongodb-memory-server`, no requiere servicios externos).
