# Testing — ecommerce-app

## Estrategia

| Capa | Herramienta | Qué valida |
|---|---|---|
| Unitaria | Jest 27 + React Testing Library | Comportamiento de componentes y contextos de forma aislada |
| E2E | Cypress 15 | Flujos completos: registro, login, carrito, checkout |

Los tests unitarios usan **axios-mock-adapter** para interceptar llamadas HTTP sin depender del backend. Los tests E2E requieren backend y seed activos.

---

## Dependencias

```
@testing-library/react      ^16  — render, screen, waitFor
@testing-library/jest-dom   ^6   — matchers personalizados (.toBeInTheDocument, etc.)
@testing-library/user-event ^13  — simulación de eventos de usuario (v13, API síncrona)
axios-mock-adapter          ^2   — mock de axios para tests unitarios
cypress                     ^15  — tests E2E
start-server-and-test       ^2   — CI: levanta servidor y corre Cypress
```

> **Nota**: La versión instalada de `@testing-library/user-event` es la v13. No usa `userEvent.setup()` (API de v14). Todos los eventos se llaman directamente: `userEvent.type(element, 'texto')`.

---

## Estructura de carpetas

```
ecommerce-app/
├── src/
│   ├── mocks/
│   │   ├── handlers.js          — setupDefaultMocks(mock): configura respuestas por defecto
│   │   └── server.js            — instancia única de MockAdapter sobre apiClient
│   ├── components/
│   │   ├── LoginForm/__tests__/LoginForm.test.jsx
│   │   ├── RegisterForm/__tests__/RegisterForm.test.jsx
│   │   └── ProductCard/__tests__/ProductCard.test.jsx
│   │   └── ProductDetails/__tests__/ProductDetails.test.jsx
│   ├── context/__tests__/CartContext.test.jsx
│   └── pages/__tests__/
│       ├── ProtectedRoute.test.jsx
│       └── Checkout.test.jsx
├── cypress/
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── register.cy.js
│   │   │   └── login.cy.js
│   │   └── checkout/
│   │       └── checkout.cy.js
│   ├── fixtures/
│   │   ├── users.json
│   │   └── products.json
│   ├── support/
│   │   ├── commands.js          — cy.loginByApi(), cy.addProductToCart()
│   │   └── e2e.js
│   └── utils/
│       └── testData.js          — uniqueEmail(), newUser()
├── cypress.config.js
└── cypress.env.json             — credenciales (gitignored)
```

---

## Comandos de ejecución

### Tests unitarios

```bash
cd ecommerce-app

# Modo watch (desarrollo)
npm test

# Una sola pasada (CI)
npm run test:run

# Con cobertura
npm run test:coverage
```

### Tests E2E

Requieren que el backend (`ecommerce-api`) y el frontend (`ecommerce-app`) estén corriendo.

```bash
# Modo interactivo (para depurar)
npm run cypress:open

# Modo headless (CI)
npm run cypress:run

# Levanta frontend y corre Cypress automáticamente
npm run test:all
```

### Todo junto

```bash
npm run test:run && npm run cypress:run
```

---

## Preparación de datos para E2E

### 1. Iniciar la base de datos y el backend

```bash
cd ecommerce-api
npm run dev
```

### 2. Ejecutar el seed

```bash
npm run seed
```

El seed crea:
- **admin@ecommerce.com** / admin123 — rol admin
- **alice@ecommerce.com** / password123 — rol customer
- **bob@ecommerce.com** / password123 — rol customer
- Categorías y productos de ejemplo
- Direcciones y métodos de pago para alice

### 3. Obtener TEST_PRODUCT_ID

```bash
curl http://localhost:4000/api/products | jq '.[0]._id'
```

Copiar el ID y pegarlo en `cypress.env.json`:

```json
{
  "TEST_PRODUCT_ID": "<id-del-producto>"
}
```

---

## Variables de entorno Cypress

Archivo `cypress.env.json` (gitignored — no incluir en control de versiones):

```json
{
  "TEST_USER_EMAIL": "alice@ecommerce.com",
  "TEST_USER_PASSWORD": "password123",
  "TEST_ADMIN_EMAIL": "admin@ecommerce.com",
  "TEST_ADMIN_PASSWORD": "admin123",
  "TEST_PRODUCT_ID": ""
}
```

En CI, se pasan como variables de entorno con prefijo `CYPRESS_`:
```
CYPRESS_TEST_USER_EMAIL=alice@ecommerce.com
CYPRESS_TEST_USER_PASSWORD=password123
```

---

## Comandos personalizados Cypress

### `cy.loginByApi({ email, password })`

Llama a `POST /api/auth/login` y guarda el token en `localStorage`. Usa `cy.session()` para cachear la sesión entre tests del mismo suite.

```js
beforeEach(() => {
  cy.loginByApi({ email: 'alice@ecommerce.com', password: 'password123' });
});
```

### `cy.addProductToCart({ productId, quantity })`

Visita `/product/:productId`, espera que el detalle cargue y hace click en "Agregar al carrito".

---

## Tabla de data-testid

| Componente | Elemento | data-testid |
|---|---|---|
| LoginForm | Botón submit | `login-submit-button` |
| RegisterForm | Botón submit | `register-submit-button` |
| RegisterForm | Error por campo | `field-error-{fieldName}` |
| ProductCard | Botón agregar | `add-to-cart-button` |
| ProductDetails | Contenedor | `product-detail` |
| ProductDetails | Botón agregar | `add-to-cart-button` |
| Header/Nav | Badge contador carrito | `cart-count` |
| CartView | Fila de item | `cart-item-{productId}` |
| Cart (página) | Total | `cart-total` |
| Cart (página) | Botón checkout | `cart-checkout-button` |
| Checkout | Total final | `checkout-grand-total` |
| Checkout | Botón confirmar | `checkout-confirm-button` |
| OrderConfirmation | Contenedor éxito | `order-success` |
| OrderConfirmation | Número de orden | `order-number` |

---

## Defectos conocidos

Detectados durante la implementación de tests. **No se modificó código de producción** para forzar el paso de los tests — los tests verifican el comportamiento real actual.

| ID | Archivo | Descripción | Severidad |
|---|---|---|---|
| DEF-01 | `CartContext.jsx` | `items.product_id` debería ser `item.product._id` — falla al detectar duplicados al agregar un producto ya existente en el carrito | HIGH |
| DEF-02 | `CartContext.jsx` | Variable `cartid` (minúscula) usada donde se declara `cartId` (camelCase) — posible fallo en reemplazo de carrito backend | MEDIUM |
| DEF-03 | `App.jsx` | Ruta `/settings` duplicada — dos bloques `<Route>` idénticos | LOW |
| DEF-04 | `Checkout.jsx` | `<Loading message="..." />` — el componente Loading usa `{children}` no `{message}`, por lo que el texto de carga nunca se renderiza | LOW |

---

## Partes mockeadas vs reales

### Tests unitarios (axios-mock-adapter)

**Mockeado:**
- Todas las llamadas HTTP a la API (`/auth/*`, `/products`, `/cart/*`, etc.)
- Contextos de React (AuthContext, CartContext) cuando el test lo requiere

**Real:**
- Lógica de validación de formularios
- Cálculos de totales, impuestos, envío
- Manejo de errores de la API clasificados por `classifyError`
- Renderizado de componentes

### Tests E2E (Cypress)

**Real (requiere backend corriendo):**
- Llamadas HTTP al backend real
- Autenticación JWT real
- Base de datos MongoDB real (datos del seed)

**No testeado en E2E:**
- Pasarela de pago (el tipo `cash_on_delivery` evita integraciones reales)

---

## Limitaciones

- El backend (`ecommerce-api`) debe estar corriendo en `localhost:4000` para los tests E2E.
- El frontend (`ecommerce-app`) debe estar corriendo en `localhost:3000` para los tests E2E.
- El seed debe haber sido ejecutado al menos una vez antes de los E2E.
- Los tests E2E de checkout avanzado (creación de orden completa) requieren que alice tenga al menos una dirección y un método de pago en la base de datos — el seed los crea.
