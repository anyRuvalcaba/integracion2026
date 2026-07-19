# Estrategia de pruebas — ecommerce workspace

> Describe el estado real de la estrategia de pruebas de este proyecto. No es aspiracional — cada afirmación está verificada contra el código y la ejecución real de la suite (auditoría 2026-07-17).

## Objetivo

Que cada nivel de prueba cubra lo que le corresponde, sin que todo dependa de Cypress, y que la cobertura real sea visible y verificable en vez de asumida.

## Pirámide de pruebas

Referencia: 60% unitarias / 25% integración / 15% E2E. Estado real actual (no es la distribución objetivo, es el conteo real hoy):

| Nivel | Tests reales | % del total |
|---|---|---|
| Backend unitario | 22 | 11% |
| Backend integración | 158 | 79% del backend, 44% del total combinado backend+frontend+E2E |
| Frontend unitario/integración | 52 | 21% |
| E2E (Cypress) | 16 | 6% |

El backend está invertido respecto a la pirámide de referencia (más integración que unitario) porque no existe capa de servicios/validadores separada de los controllers — ver `known-issues.md`. No se corrige en esta fase; es una observación para cuando se aborden `TEST-002`/`TEST-006` del backlog.

## Qué cubre cada nivel en este proyecto

### Backend unitario (`ecommerce-api/src/__tests__/unit/`)
Middlewares aislados (`authMiddleware`, `isAdminMiddleware`, `validation`, `errorHandler`, `logger`) y hashing de password. Vitest + `vi.mock` donde corresponde. Rápidos, deterministas, sin `mongodb-memory-server`.

### Backend integración (`ecommerce-api/src/__tests__/integration/`)
Endpoints reales vía Supertest contra una app Express real (`helpers/createApp.js`, sin `app.listen()`), con `mongodb-memory-server` (`helpers/db.js`) y limpieza de colecciones entre tests. Es el nivel dominante de este proyecto — cubre auth, autorización por rol, validación de `express-validator`, persistencia real, y todos los status codes documentados en `.claude/CLAUDE.md`.

### Frontend unitario/integración (`ecommerce-app/src/**/__tests__/`)
Jest (vía `react-scripts`) + React Testing Library. Mocking de HTTP con `axios-mock-adapter` sobre `apiClient` (ver `test-data.md` — **no MSW**, pese a que `msw` está instalado). Wrapper `renderWithProviders` (`src/test-utils.jsx`) monta `MemoryRouter > AuthProvider > CartProvider`. Aserciones sobre lo que el usuario ve (`getByRole`, `getByText`, `getByLabelText`), nunca sobre estado interno.

### E2E (Cypress)
Flujos completos con backend y MongoDB reales (vía `mongodb-memory-server` no aplica aquí — Cypress corre contra el backend real con Mongo real, no memory-server). Reservado para: login, registro, y el flujo carrito→checkout→orden. No se duplica en Cypress nada que ya esté cubierto a nivel unitario o de integración.

## Herramientas (reales, verificadas)

| Capa | Herramienta | Versión |
|---|---|---|
| Backend test runner | Vitest | 4.1.9 |
| Backend HTTP testing | Supertest | 7.2.2 |
| Backend DB en memoria | mongodb-memory-server | 11.2.0 |
| Backend cobertura | @vitest/coverage-v8 | 4.1.9 |
| Frontend test runner | Jest (vía react-scripts 5.0.1) | 27 (transitiva) |
| Frontend testing | @testing-library/react | 16.3.0 |
| Frontend user events | @testing-library/user-event | 13.5.0 (API síncrona, no `.setup()`) |
| Frontend mocking HTTP | axios-mock-adapter | 2.1.0 |
| E2E | Cypress | 15.18.0 |
| E2E orquestación | start-server-and-test | 2.1.5 |

`msw` (`^2.14.6`) está instalado en `devDependencies` pero **sin ninguna referencia en el código fuente** — ver `known-issues.md`.

## Alcance

Cubre `ecommerce-api` (backend) y `ecommerce-app` (frontend). No cubre infraestructura de despliegue (no existe — ni Dockerfile ni config de deploy en el repo).

## Contract testing — sin dependencia nueva

No se introduce Zod, JSON Schema ni OpenAPI para validar contratos entre frontend y backend. Se reutiliza lo que ya existe y ya hace ese trabajo: `.claude/agents/anti-hallucination-reviewer.md` (checks 3 y 4) verifica, en cada pendiente revisado, que las rutas llamadas desde el frontend existen y están montadas, y que los campos de modelo referenciados en frontend/backend coinciden con el schema real de Mongoose (ej. `Cart.products[].product`, no `productId`). Es contract testing aplicado en el momento de la revisión de código, no en tiempo de ejecución — suficiente para el tamaño de este proyecto, sin agregar una dependencia nueva que el proyecto no justifica.

## Criterios de aceptación de esta estrategia

- Cada nivel prueba lo que le corresponde — no se duplica en Cypress lo que ya cubre un nivel inferior.
- Ningún test se deshabilita para simular éxito.
- Ningún hallazgo de bug real se oculta o se "arregla" cambiando el test en vez del código (o documentando el gap si no se corrige).
- La matriz de trazabilidad (`test-matrix.md`) es la fuente de verdad de qué está cubierto — se actualiza cada vez que se cierra un ítem del backlog `TEST-XXX`.
