# Matriz de trazabilidad de pruebas

> Estado verificado contra el código y la ejecución real de la suite (auditoría 2026-07-17 / 2026-07-19). Cada fila corresponde a un módulo/escenario real — ninguno inventado. `Estado` refleja lo que existe hoy, no lo planeado. Se actualiza cada vez que se cierra un ítem `TEST-XXX` de `docs/backlog.md`.

Leyenda de columnas de nivel: Sí = tiene test real verificado | No = sin test | N/A = no aplica a ese nivel, con justificación en la nota.

| ID | Módulo | Escenario | Backend unit | API integración | Frontend unit | E2E | Prioridad | Estado |
|---|---|---|---|---|---|---|---|---|
| AUTH-001 | Auth | Registro exitoso | N/A | Sí (IT-AUTH-001..003) | Sí (RegisterForm.test.jsx) | Sí (register.cy.js) | Crítica | Implementado |
| AUTH-002 | Auth | Email duplicado en registro | N/A | Sí (409, IT-AUTH-004) | Sí (RegisterForm.test.jsx) | Sí (register.cy.js) | Alta | Implementado |
| AUTH-003 | Auth | Login exitoso | N/A | Sí (IT-AUTH-007..008) | Sí (LoginForm.test.jsx) | Sí (login.cy.js) | Crítica | Implementado |
| AUTH-004 | Auth | Credenciales inválidas | N/A | Sí (400, IT-AUTH-009..011) | Sí (LoginForm.test.jsx) | Sí (login.cy.js) | Alta | Implementado |
| AUTH-005 | Auth | Persistencia de sesión / token en localStorage | N/A | N/A (no es responsabilidad del backend) | Parcial (cubierto indirectamente vía LoginForm/ProtectedRoute, sin test directo de AuthContext) | Sí (login.cy.js) | Media | Parcial — ver TEST-011 |
| AUTH-006 | Auth | Ruta protegida sin sesión → redirect a /login | N/A | N/A | Sí (ProtectedRoute.test.jsx) | Sí (login.cy.js) | Alta | Implementado |
| AUTH-007 | Auth | Middleware JWT: sin token / token inválido / rol equivocado | Sí (authMiddleware.test.js, isAdminMiddleware.test.js) | Sí (cubierto en cada módulo con rutas admin/auth) | N/A | N/A | Crítica | Implementado |
| PROD-001 | Productos | Listado y búsqueda | N/A | Sí (IT-PROD-001..006, 023) | Sí (ProductCard.test.jsx) | Implícito (cy.addProductToCart visita /product/:id) | Alta | Implementado |
| PROD-002 | Productos | Detalle de producto | N/A | Sí (IT-PROD-007..008) | Sí (ProductDetails.test.jsx) | Implícito | Alta | Implementado |
| PROD-003 | Productos | Creación/actualización/eliminación (admin) | N/A | Sí (IT-PROD-009..022) | N/A (no hay UI admin en este proyecto) | N/A | Alta | Implementado |
| PROD-004 | Productos | Validación de precio/stock en creación | N/A | Sí (422, dentro de IT-PROD-009..014) | N/A | N/A | Media | Implementado |
| PROD-005 | Productos | Página de búsqueda / resultados | N/A | N/A | No (SearchResultsList sin test) | No | Media | Pendiente — TEST-012 |
| CAT-001 | Categorías | CRUD + árbol de categorías (self-reference) | N/A | Sí (IT-CAT-001..016) | No (CategoryProducts sin test) | No | Media | Parcial — ver TEST-012 |
| CART-001 | Carrito | Obtener carrito por usuario | N/A | Sí (IT-CART-004..006) | Parcial (vía CartContext.test.jsx, no CartView) | Sí (checkout.cy.js → "Carrito") | Crítica | Parcial — ver TEST-003 |
| CART-002 | Carrito | Crear/actualizar/eliminar carrito | N/A | Sí (IT-CART-007..012, 017..018) | Parcial (vía CartContext.test.jsx) | Sí | Crítica | Parcial — ver TEST-003 |
| CART-003 | Carrito | Detección de duplicado al agregar producto existente | N/A | N/A (lógica vive en frontend) | Existe pero **el código tiene DEF-01** — el test puede estar validando el comportamiento roto | Sí | Alta | Implementado (con bug documentado, ver known-issues.md) |
| CART-004 | Carrito | `addProductToCart` (función de controller) | No | No — **función no montada en ninguna ruta** | N/A | N/A | Media | Pendiente — TEST-006 (decisión de arquitectura primero) |
| CART-005 | Carrito | Componente `CartView` / página `Cart` | N/A | N/A | No | Sí (indirecto, vía checkout.cy.js) | Alta | Pendiente — TEST-003 |
| ORD-001 | Órdenes | Crear orden | N/A | Sí (IT-ORD-007..009, 014..015) | Sí (Checkout.test.jsx) | Sí (checkout.cy.js) | Crítica | Implementado |
| ORD-002 | Órdenes | Validación de `totalPrice`/stock contra el carrito real | N/A | **No existe la regla en el código** — nada que testear hasta que se implemente | N/A | N/A | Alta | Pendiente — TEST-002 (requiere implementación primero) |
| ORD-003 | Órdenes | Obtener orden propia / impedir acceso a orden ajena | N/A | Sí (IT-ORD-004..006, 010..013) | N/A | N/A | Alta | Implementado |
| ORD-004 | Órdenes | Página `Orders`, `PurchaseOrder`, `OrderConfirmation` | N/A | N/A | No | Parcial (checkout.cy.js solo verifica redirect a /order-confirmation) | Media | Pendiente — TEST-008 |
| USR-001 | Usuarios | CRUD (admin) | N/A | Sí (IT-USR-001..015) | N/A (sin UI admin) | N/A | Media | Implementado |
| WISH-001 | Wishlist | Agregar/quitar producto, obtener por usuario | N/A | Sí (IT-WISH-001..015) | No (página WishList sin test) | No | Media | Parcial — TEST-009 |
| PAY-001 | Métodos de pago | CRUD | N/A | Sí (IT-PAY-001..002, 004..020) | Parcial (formularios sin test dedicado) | No | Alta | Parcial — TEST-005 |
| PAY-002 | Métodos de pago | `GET /payment-methods/me` | N/A | **No — cero tests, endpoint activo** | N/A | N/A | Alta | Pendiente — TEST-001 |
| PAY-003 | Métodos de pago | CVV nunca en response | N/A | Sí (dentro de IT-PAY-008..013, ya corregido según test-plan) | N/A | N/A | Alta | Implementado |
| ADDR-001 | Direcciones | CRUD user-scoped | N/A | Sí (IT-ADDR-001..025) | Parcial (formularios sin test dedicado) | No | Alta | Parcial — TEST-004 |
| PROF-001 | Perfil | Página `Profile`, `ProfileCard` | N/A | N/A | No | No | Media | Pendiente — TEST-010 |
| UI-001 | Layout | Header (cart-count), Footer, Navigation, Breadcrumb, Newsletter | N/A | N/A | No | Implícito (cart-count se verifica en E2E) | Baja | Pendiente — TEST-015 |
| UI-002 | Common | Button, Input, Badge, ErrorMessage, Icon, Loading | N/A | N/A | No (ejercidos indirectamente vía otros tests, sin test directo) | N/A | Baja | Pendiente — TEST-016 |
| UI-003 | Theme | `ThemeContext` | N/A | N/A | No | N/A | Baja | Pendiente — TEST-017 |
| CONFIG-001 | Config | `db.conf.js` (conexión Mongoose) | No (0% cobertura) | N/A (cubierto indirectamente — toda la suite de integración depende de que conecte) | N/A | N/A | Baja | Aceptado sin test directo (ver test-plan existente) |

## Resumen numérico

- **Total de escenarios mapeados:** 33
- **Implementados completos:** 15
- **Parciales:** 10
- **Pendientes:** 8
- Ningún escenario mapeado corresponde a un módulo o archivo que no exista en el código real — verificado contra la auditoría del 2026-07-17/19.
