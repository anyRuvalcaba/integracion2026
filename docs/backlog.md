# Backlog

> Única fuente de trabajo válida (P-14, `.agents/protocols/global-rules.md`). Ningún pendiente se trabaja sin estar registrado aquí.

| ID | Tipo | Descripción | Prioridad | Estado |
|---|---|---|---|---|
| INFRA-001 | infra | Harness de modelos y agentes versionado (`.claude/model-policy.md`, materialización de 17 agentes, `dod-loop.md`, ADR-1) | Alta | Listo para merge — spec DONE, PR #1 con `tech-reviewer` APTO (3ª pasada), pendiente de aprobación del usuario |
| INFRA-002 | infra | Activar FASE 10.5 (baseline oficial, tag `baseline/v1.0`) cuando el backlog esté formalizado y priorizado en su totalidad | Media | Pendiente |
| INFRA-003 | infra | Verificar manualmente que el plugin `codex@openai-codex` declarado en `.claude/settings.json` carga correctamente | Media | Pendiente |
| INFRA-004 | infra | Mergear PR #1 (`infra/model-agent-harness` → `develop`) — `tech-reviewer` dio APTO en la 3ª pasada, listo técnicamente; falta la aprobación explícita del usuario para mergear | Alta | Listo para merge |
| INFRA-005 | bugfix | Investigar `IT-CART-014` (`ecommerce-api/src/__tests__/integration/cart.test.js`) por posible flakiness — falló en una corrida (179/180) y pasó en otra (180/180) sobre el mismo commit; `docs/test-plans/backend-test-plan.md` lo documenta como 180/180 estable. No relacionado con INFRA-001 | Media | Pendiente |
| INFRA-006 | docs | `ecommerce-api/.env.example` tiene `PORT=3000` pero el `.env` real y `apiClient.js` usan `4000` — alinear el ejemplo con el valor real | Baja | Pendiente |
| BUG-001 | bugfix | `AuthProvider` ausente en `ecommerce-app/src/components/App/App.jsx` — solo `CartProvider` está montado, `useAuth()` fallaría en cualquier componente que lo use | Crítica | Pendiente |
| BUG-002 | bugfix | `CartContext.jsx:85` usa `items.product_id`; el campo real del modelo `Cart.products[]` es `product` (ObjectId), no `product_id` — el cálculo de carrito no coincide con el schema | Crítica | Pendiente |
| BUG-003 | bugfix | `CartContext.jsx` mezcla `cartid` (línea 14, declarado) con `cartId` (línea 124, usado) — nombres de variable de estado inconsistentes, el carrito no actualiza correctamente | Crítica | Pendiente |
| BUG-004 | bugfix | `ecommerce-api/server.js` registra `errorHandler` (línea 23) ANTES de `app.use("/api", routes)` (línea 31) — los errores de las rutas no pasan por el error handler centralizado | Alta | Pendiente |
| BUG-005 | bugfix | `cartController.js:160` usa `cart.populate("products.productId")`; el campo real en `Cart.products[]` es `product`, no `productId` — `addProductToCart` probablemente falla o no popula correctamente | Alta | Pendiente |
| INFRA-007 | docs | Limpieza de referencias residuales en `.agents/`: `anti-hallucination-reviewer.md` menciona IDs obsoletos `T-015/T-016` (no existen en este backlog), y quedan menciones informales a `CLAUDE.md` sin el prefijo `.claude/` en varios roles (no son comandos ejecutables, solo prosa descriptiva) | Baja | Pendiente |
| TEST-001 | test | Backend: `GET /payment-methods/me` sin test de integración — endpoint activo en producción, único con 0% de cobertura (ver `docs/testing/known-issues.md`) | Alta | Pendiente |
| TEST-002 | test | Backend: sin validación de `totalPrice`/stock en `createOrder` — riesgo de negocio real (dinero, sin cobertura); requiere implementar la regla antes de poder testearla | Alta | Pendiente |
| TEST-003 | test | Frontend: `CartView`/página `Cart` sin test unitario — core flow, solo cubierto indirectamente vía `CartContext.test.jsx` | Alta | Pendiente |
| TEST-004 | test | Frontend: `Checkout/Address` (`AddressForm`, `AddressList`, `AddressItem`) sin test unitario dedicado | Alta | Pendiente |
| TEST-005 | test | Frontend: `Checkout/Payment` (`PaymentForm`, `PaymentList`, `PaymentItem`) sin test unitario dedicado | Alta | Pendiente |
| TEST-006 | infra | Backend/Arquitectura: decidir destino de `cartController.addProductToCart` (montarla corrigiendo el bug de `BUG-005`, o eliminar código muerto) — requiere `architecture-reviewer` antes de implementar | Media | Pendiente |
| TEST-007 | test | Frontend: `SummarySection` sin test aislado (solo cubierto indirectamente vía `Checkout.test.jsx`) | Media | Pendiente |
| TEST-008 | test | Frontend: `Orders`, `PurchaseOrder`, `OrderConfirmation` sin test unitario | Media | Pendiente |
| TEST-009 | test | Frontend: `WishList` sin test unitario | Media | Pendiente |
| TEST-010 | test | Frontend: `Profile`/`ProfileCard` sin test unitario | Media | Pendiente |
| TEST-011 | test | Frontend: `AuthContext` sin test directo — solo cubierto indirectamente vía `LoginForm`/`ProtectedRoute` | Media | Pendiente |
| TEST-012 | test | Frontend: `CategoryProducts`/`SearchResultsList`/páginas wrapper (`Product.jsx`, `CategoryPage.jsx`, `SearchResults.jsx`) sin test | Media | Pendiente |
| TEST-013 | test | E2E: sin spec dedicado a alta/edición de dirección y método de pago | Media | Pendiente |
| TEST-014 | test | Frontend: correr `npm run test:coverage` para establecer la cobertura real y proponer thresholds iniciales — hoy no hay ninguno configurado (a diferencia del backend, que tiene 70/70/60/70) | Media | Pendiente |
| TEST-015 | test | Frontend: `layout/` (Header, Footer, Navigation, Breadcrumb, Newsletter) sin test | Baja | Pendiente |
| TEST-016 | test | Frontend: `common/` (Button, Input, Badge, ErrorMessage, Icon, Loading) sin test directo | Baja | Pendiente |
| TEST-017 | test | Frontend: `ThemeContext` sin test | Baja | Pendiente |
| TEST-018 | test | E2E: sin spec de búsqueda/categorías, Orders, WishList, Profile | Baja | Pendiente |
| TEST-019 | infra | Root: evaluar si conviene un `package.json` raíz con scripts unificados (`test:all`, etc.) — requiere `architecture-reviewer`, decisión estructural | Baja | Pendiente |
| TEST-020 | test | Backend: `src/config/db.conf.js` sin test (0% cobertura) — ya aceptado como bajo impacto en `docs/test-plans/backend-test-plan.md` | Baja | Pendiente |
