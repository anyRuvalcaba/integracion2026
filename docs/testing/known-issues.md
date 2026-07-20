# Known issues — testing

> Consolida defectos de aplicación descubiertos vía testing, deuda de infraestructura de testing, y tests inestables. Todo lo listado aquí está verificado contra el código real — nada es especulación. Ningún ítem se corrige en este documento; cada uno tiene su referencia de backlog.

## Defectos de aplicación (descubiertos por los tests existentes)

Documentados originalmente en `ecommerce-app/docs/testing.md`, verificados de nuevo aquí contra el código real:

| ID | Archivo | Descripción | Severidad real | Referencia |
|---|---|---|---|---|
| DEF-01 | `src/context/CartContext.jsx:85` | `items.product_id === product._id` — `items` es el array completo del carrito, no tiene `.product_id`; la comparación siempre es `undefined === product._id` → `false`. Nunca detecta que un producto ya está en el carrito. | Alta | `BUG-002` (`docs/backlog.md`) |
| DEF-02 | `src/context/CartContext.jsx:14,124` | `cartid` (minúscula) se declara con `useState` en la línea 14; la línea 124 lee `cartId` (camelCase), que no existe en ese scope. **Es un `ReferenceError` en tiempo de ejecución** dentro de `syncWithApi`, no solo una inconsistencia de nombres — más grave de lo que documentaba originalmente `ecommerce-app/docs/testing.md`. | Crítica (corregido de Media a Crítica en esta auditoría) | `BUG-003` |
| DEF-03 | `src/components/App/App.jsx:67,75` | Ruta `/settings` declarada dos veces. | Baja | — (agregar a backlog si se prioriza) |
| DEF-04 | `src/pages/Checkout.jsx:288` | `<Loading message="..." />` pero `Loading.jsx` recibe `{children}`, no `{message}` — el texto nunca se renderiza. | Baja | — (agregar a backlog si se prioriza) |
| — | `ecommerce-api/src/server.js:23,31` | `errorHandler` registrado antes de `app.use("/api", routes)` — los errores lanzados en rutas no pasan por el manejador centralizado. | Alta | `BUG-004` |
| — | `ecommerce-api/src/controllers/cartController.js:160` | `addProductToCart` usa `.populate("products.productId")`; el campo real del schema `Cart.products[]` es `product`. Función no montada en ninguna ruta, así que este bug nunca se ejecuta hoy — pero si se monta sin corregirlo, el populate no hará nada útil. | Alta (condicional a que se monte la ruta) | `BUG-005`, `TEST-006` |

Nota explícita heredada del documento original: no se modificó código de producción para forzar el paso de los tests — los tests existentes verifican el comportamiento real actual, defectos incluidos.

## Gaps de backend (nuevos, encontrados en esta auditoría)

| Hallazgo | Archivo | Impacto |
|---|---|---|
| `GET /api/payment-methods/me` sin ningún test | `paymentMethodRoutes.js:72`, `paymentMethodController.js:12-20` | Único endpoint activo del proyecto con 0% de cobertura de integración. Ausente también de `.claude/CLAUDE.md` y de `docs/test-plans/backend-test-plan.md` antes de esta sesión. |
| `cartController.addProductToCart` nunca montada | `cartController.js:136-166` (exportada, no importada en `cartRoutes.js`) | Código muerto desde el punto de vista de la API HTTP. Baja la cobertura de `cartController.js` a 61.5% líneas — el archivo con peor cobertura del backend. |
| Sin validación de `totalPrice`/stock en `createOrder` | `orderController.js:34-55` | El cliente puede enviar cualquier `totalPrice`; no hay recálculo server-side contra `Product.price`, ni verificación/decremento de `Product.stock`. Riesgo de negocio real (dinero), sin ningún test posible hasta que la regla exista. |
| Tabla "Resumen global" desactualizada | `docs/test-plans/backend-test-plan.md` (antes de esta sesión) | Sumaba 169 en vez de 180 — las matrices detalladas por módulo del mismo documento sí estaban correctas; solo la tabla resumen final no se había regenerado. Corregido en esta sesión. |

## Deuda de infraestructura de testing (frontend)

| Hallazgo | Detalle |
|---|---|
| `msw` instalado sin usar | `^2.14.6` en `devDependencies`, cero referencias en `src/`. El código real usa `axios-mock-adapter`; los archivos `src/mocks/server.js`/`handlers.js` tienen nombres "estilo MSW" que son engañosos sobre la implementación real. |
| `setupPolyfills.js` código muerto | Duplica exactamente el polyfill de `TextEncoder`/`TextDecoder` que ya está en `setupTests.js`. Sin ninguna referencia en el árbol (no está en `setupFiles` de ninguna config). Eliminado en esta sesión. |
| CI: artifact de cobertura frontend nunca se genera | `.github/workflows/frontend-tests.yml`, job `unit-tests`, corría `npm run test:run` (sin `--coverage`) pero subía un artifact `coverage-report` — la carpeta nunca existía. Corregido en esta sesión (cambiado a `npm run test:coverage`). |
| Sin CI para backend | No existía ningún workflow que corriera `npm test` en `ecommerce-api`. Agregado en esta sesión (`.github/workflows/backend-tests.yml`). |
| Sin thresholds de cobertura en frontend | A diferencia del backend (`vitest.config.js`: 70/70/60/70, cumplidos con margen), el frontend no tiene ningún threshold configurado. Ver `TEST-014`. |

## Tests inestables (flaky)

| Test | Detalle |
|---|---|
| `IT-CART-014` (`ecommerce-api/src/__tests__/integration/cart.test.js`, "403 con token de customer") | Falló en una ejecución real (179/180) y pasó en otra (180/180) sobre el mismo commit, durante el trabajo de harness de agentes (2026-07-17). `docs/test-plans/backend-test-plan.md` lo documenta como estable en 180/180. No investigado a fondo — ver `INFRA-005` en `docs/backlog.md`. |

## Regla para nuevos hallazgos

Cualquier defecto de aplicación que se descubra al escribir un test nuevo (parte del trabajo futuro vía `TEST-XXX`) se documenta aquí y se registra en `docs/backlog.md` como `BUG-XXX` — no se corrige silenciosamente cambiando el test para que el defecto pase inadvertido.
