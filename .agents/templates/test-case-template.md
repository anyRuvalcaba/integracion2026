# Template — Test Case

> Usado por `qa-test-designer` para documentar casos de prueba en `docs/test-plans/`.

---

# Plan de Pruebas — [ID del pendiente]

**Spec relacionado:** `docs/specs/[YYYY-MM-DD]-[tipo]-[nombre].md`
**Fecha:** YYYY-MM-DD
**Agentes de ejecución:**
- Backend: `.claude/agents/backend-tester.md`
- Frontend: `.claude/agents/frontend-tester.md`

---

## [Alta] Módulo: [nombre del módulo]

**Archivo fuente backend:** `ecommerce-api/src/routes/[modulo]Routes.js`
**Archivo fuente frontend:** `ecommerce-app/src/components/[Modulo]/[Modulo].jsx`
**Suite sugerida backend:** `ecommerce-api/src/__tests__/routes/[modulo].test.js`
**Suite sugerida frontend:** `ecommerce-app/src/__tests__/components/[Modulo].test.jsx`

### Casos de prueba — Backend

| # | Descripción | Input | Status esperado | Body esperado |
|---|---|---|---|---|
| 1 | 401 sin token | Sin Authorization header | 401 | — |
| 2 | 401 token inválido | Bearer invalid_string | 401 | — |
| 3 | 403 token de customer (si ruta admin) | Bearer token role:customer | 403 | — |
| 4 | 422 campo X faltante | body sin campo X | 422 | errors[] |
| 5 | 422 campo X formato inválido | body.X = valor_invalido | 422 | errors[] |
| 6 | Happy path | body válido completo | 200/201 | { campo: valor } |
| 7 | 404 recurso no encontrado | id inexistente | 404 | { message: "..." } |

### Casos de prueba — Frontend

| # | Descripción | Acción del usuario | Elemento esperado |
|---|---|---|---|
| 1 | Formulario vacío deshabilita submit | — | `button[submit]` está deshabilitado |
| 2 | Error de validación visible | Submit con campos inválidos | Mensaje de error en pantalla |
| 3 | Error 401 redirige a login | Server responde 401 | URL cambia a /login |
| 4 | Happy path muestra confirmación | Datos válidos + submit | Mensaje de éxito |

---

## [Media] Módulo: [nombre del módulo adicional si aplica]

[Repetir la tabla para cada módulo afectado por el pendiente]

---

## Notas para los agentes de ejecución

- Usar `mongodb-memory-server` para backend (nunca mocks de Mongoose).
- Usar MSW para interceptar axios en frontend (nunca `jest.mock("axios")`).
- El wrapper de frontend debe ser `AllProviders` (AuthProvider + CartProvider + MemoryRouter).
- Auth simulada en tests: `localStorage.setItem("authToken", tokenGenerado)`.
- Cada ruta con `authMiddleware`: los 3 casos de auth negativos son obligatorios (sin token → 401, token inválido → 401, rol equivocado → 403).
