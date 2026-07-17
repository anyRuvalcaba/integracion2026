# Backlog

> Única fuente de trabajo válida (P-14, `.agents/protocols/global-rules.md`). Ningún pendiente se trabaja sin estar registrado aquí.

| ID | Tipo | Descripción | Prioridad | Estado |
|---|---|---|---|---|
| INFRA-001 | infra | Harness de modelos y agentes versionado (`.claude/model-policy.md`, materialización de 17 agentes, `dod-loop.md`, ADR-1) | Alta | DONE |
| INFRA-002 | infra | Activar FASE 10.5 (baseline oficial, tag `baseline/v1.0`) cuando el backlog esté formalizado y priorizado en su totalidad | Media | Pendiente |
| INFRA-003 | infra | Verificar manualmente que el plugin `codex@openai-codex` declarado en `.claude/settings.json` carga correctamente | Media | Pendiente |
| INFRA-004 | infra | Abrir el PR real de `infra/model-agent-harness` contra `develop` (push ya completado 2026-07-16; falta invocar `pr-publisher` y `tech-reviewer`) | Alta | En progreso |
| INFRA-005 | bugfix | Investigar y corregir el test `IT-CART-014` (`ecommerce-api/src/__tests__/integration/cart.test.js`) — falla preexistente, no relacionada con INFRA-001 | Media | Pendiente |
| INFRA-006 | docs | `ecommerce-api/.env.example` tiene `PORT=3000` pero el `.env` real y `apiClient.js` usan `4000` — alinear el ejemplo con el valor real | Baja | Pendiente |
| BUG-001 | bugfix | `AuthProvider` ausente en `ecommerce-app/src/components/App/App.jsx` — solo `CartProvider` está montado, `useAuth()` fallaría en cualquier componente que lo use | Crítica | Pendiente |
| BUG-002 | bugfix | `CartContext.jsx:85` usa `items.product_id`; el campo real del modelo `Cart.products[]` es `product` (ObjectId), no `product_id` — el cálculo de carrito no coincide con el schema | Crítica | Pendiente |
| BUG-003 | bugfix | `CartContext.jsx` mezcla `cartid` (línea 14, declarado) con `cartId` (línea 124, usado) — nombres de variable de estado inconsistentes, el carrito no actualiza correctamente | Crítica | Pendiente |
| BUG-004 | bugfix | `ecommerce-api/server.js` registra `errorHandler` (línea 23) ANTES de `app.use("/api", routes)` (línea 31) — los errores de las rutas no pasan por el error handler centralizado | Alta | Pendiente |
| BUG-005 | bugfix | `cartController.js:160` usa `cart.populate("products.productId")`; el campo real en `Cart.products[]` es `product`, no `productId` — `addProductToCart` probablemente falla o no popula correctamente | Alta | Pendiente |
