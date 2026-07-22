# Spec: Auditoría de Performance del Frontend (`ecommerce-app`)

## Metadata
- **Tipo:** refactor
- **Complejidad:** M
- **Fecha:** 2026-07-21
- **Estado:** DRAFT

---

## Historia

Como Performance Engineer Senior del equipo, necesito auditar el frontend de `ecommerce-app` (Create React App + React 19.1.1 + react-router-dom 7.9.4) para identificar, con evidencia concreta de archivo y línea, oportunidades reales de:

1. Lazy loading por ruta y por componente.
2. Code splitting del bundle inicial.
3. Optimización de render (uso justificado, no indiscriminado, de `memo`/`useMemo`/`useCallback`).
4. Estrategia de caché del lado cliente, evaluando lo que ya existe (`apiClient.js`, `CartContext.jsx`, `AuthContext.jsx`, `services/*.js`, `utils/storageHelpers.js`) antes de proponer nada nuevo.
5. Carga de imágenes.
6. Reducción del JavaScript inicial (bundle).

para producir un **plan de optimización priorizado y accionable** que sirva de entrada a `architecture-reviewer` antes de que cualquier implementación real la ejecute `frontend-builder`.

- **S**pecífica: el entregable es este documento de diagnóstico y plan, no código. Cubre exclusivamente `ecommerce-app/src/`.
- **M**edible: cada hallazgo está anclado a archivo:línea real; el plan de medición (antes/después) es ejecutable con herramientas ya presentes en el proyecto (`npm run build` de `react-scripts`, DevTools/Lighthouse del navegador — no requiere instalar dependencias nuevas).
- **A**lcanzable: acotado a lo que existe hoy en el código; no depende de features no implementadas, salvo donde se documenta explícitamente una dependencia bloqueante (ver `## Dependencias`).
- **R**elevante: la percepción de velocidad de carga es la preocupación de negocio explícita del dueño del producto; el bundle actual (ver evidencia abajo) no tiene code splitting real.
- **T**emporal: Complejidad M para el spec/diagnóstico. La implementación derivada (fase posterior, sujeta a aprobación de `architecture-reviewer`) se estima L por el volumen de páginas sin cobertura de test (ver CA-7 y `## Riesgos y Deuda Técnica`).

---

## Contexto

`ecommerce-app` es una SPA de ecommerce (catálogo, carrito, checkout, órdenes, wishlist, perfil) construida con Create React App (`react-scripts 5.0.1`). Las rutas se definen en `src/components/App/App.jsx` dentro de un único `<Routes>` con imports estáticos — no hay ningún `React.lazy` en el proyecto actualmente. Se verificó con un build de producción real (`npm run build`, ejecutado 2026-07-21, artefactos en `ecommerce-app/build/`):

```
build/static/js/main.33ec6072.js       375,934 bytes raw  →  114,261 bytes gzip
build/static/js/206.6f84275d.chunk.js    4,441 bytes raw  →    1,747 bytes gzip
build/static/css/main.37773707.css      72,135 bytes raw  →   12,178 bytes gzip
```

`asset-manifest.json` confirma que solo existen **dos** entradas JS: el bundle principal (`main.js`, ~114 KB gzip) y un único chunk residual de 1.7 KB gzip generado automáticamente por Webpack (no por un `React.lazy` explícito — no hay ninguno en el código fuente). Es decir: **hoy, cualquier usuario que visita `/` descarga el JS necesario para Home, Cart, Checkout, Orders, Profile, WishList, Settings, SearchResults, ProductDetails, CategoryProducts y los formularios de Login/Register en un solo bundle**, sin importar qué ruta visite primero.

Esta auditoría busca evidencia concreta — no genérica — de dónde aplicar `React.lazy`/`Suspense`, qué NO debe tocarse (contenido crítico del layout), qué pasa con la estrategia de caché actual, y qué imports/imágenes pesan más de lo necesario.

**Nota crítica descubierta durante la auditoría, no parte del alcance de este spec pero bloqueante para medir en el entorno real:** `AuthProvider` no está montado en `src/index.js` ni en `App.jsx` (`BUG-001` del backlog, prioridad Crítica, Pendiente). `CartProvider` (que sí está montado) llama a `useAuth()` internamente en `CartContext.jsx:13`, y `useAuth()` lanza `throw new Error("useAuth debe usarse dentro de <AuthProvider>")` si no hay `AuthProvider` en el árbol (`AuthContext.jsx:71-73`). Esto significa que **la aplicación en su configuración actual de producción falla al montar `CartProvider`**, lo cual impide ejecutar cualquier medición real (Lighthouse, navegación, etc.) contra el `App.jsx` tal como está hoy. Ver `## Dependencias` y `## Riesgos y Deuda Técnica`.

---

## Criterios de Aceptación

- [ ] **CA-1**: El spec identifica, con archivo y línea, qué páginas de `ecommerce-app/src/pages/` (montadas como rutas reales en `src/components/App/App.jsx`) son candidatas concretas a `React.lazy`. Ver `## Decisiones de Diseño → Lazy loading por ruta`.
- [ ] **CA-2**: El spec identifica componentes candidatos a carga diferida (charts, tablas, editores, modales) si existen, o documenta explícitamente que no aplica. Ver `## Decisiones de Diseño → Lazy loading por componente`. **Resultado adelantado: no existen componentes de ese tipo en el proyecto — no aplica.**
- [ ] **CA-3**: El spec define qué NO debe ir en lazy loading (contenido above-the-fold, layout crítico). Ver `## Decisiones de Diseño → Qué no se toca`.
- [ ] **CA-4**: El spec evalúa la estrategia de caché actual (`apiClient.js`, `CartContext.jsx`, `AuthContext.jsx`, `services/*.js`, `utils/storageHelpers.js`) y decide qué agregar, con justificación, sin introducir una librería nueva salvo evidencia clara. Ver `## Decisiones de Diseño → Estrategia de caché`.
- [ ] **CA-5**: El spec identifica imports pesados o librerías grandes reales en `package.json` (no hipotéticas). Ver `## Decisiones de Diseño → Análisis de dependencias`.
- [ ] **CA-6**: El spec incluye un plan de medición antes/después ejecutable con herramientas ya disponibles (`npm run build`, DevTools/Lighthouse del navegador). Ver `## Decisiones de Diseño → Plan de medición`.
- [ ] **CA-7**: El spec marca explícitamente en `## Riesgos y Deuda Técnica` que la mayoría de `ecommerce-app/src/pages` y `src/components` no tiene test dedicado (`TEST-003` a `TEST-012`, cobertura real 33.79% statements según `TEST-014`), motivo por el cual este pendiente requiere `architecture-reviewer` antes de implementar.

---

## Consideraciones de Seguridad

No aplica un modelado STRIDE clásico: este spec no introduce superficie nueva de autenticación, inputs de usuario ni endpoints. Se documentan igualmente las amenazas evaluadas por completitud del protocolo:

- **Spoofing**: no aplica — no se toca `authMiddleware`, JWT ni `apiClient`'s interceptor de `Authorization`.
- **Tampering**: no aplica — no se modifican payloads enviados al backend ni validaciones.
- **Repudiation**: no aplica — no se tocan logs ni `errorHandler`.
- **Information Disclosure**: riesgo bajo pero real si una futura implementación de caché (`## Decisiones de Diseño → Estrategia de caché`) llegara a persistir en `localStorage` datos de `payment-methods` o `addresses` (que incluyen `cardNumber`/`cvv` truncados o datos personales) sin TTL ni invalidación al hacer logout. Control de mitigación exigido a la implementación futura: cualquier caché nueva debe ser **en memoria** (vive solo mientras la pestaña esté abierta) para datos de catálogo (`products`, `categories`), y **nunca** debe cachear `payment-methods` ni `addresses` en `localStorage` más allá de lo que ya hace `storageHelpers.js` hoy (que no cachea esos recursos — cachea únicamente `cart`, `shippingAddresses`/`paymentMethods` locales legacy y `orders`, ver `## Decisiones de Diseño`).
- **Denial of Service**: no aplica del lado servidor. Del lado cliente, un `React.lazy` mal aplicado sobre contenido above-the-fold degradaría UX (ver `## Decisiones de Diseño → Qué no se toca`), pero no es una amenaza de seguridad.
- **Elevation of Privilege**: no aplica — no se tocan rutas protegidas (`ProtectedRoute.jsx`) ni `allowedRoles`.
- **Secrets**: ninguno involucrado. `REACT_APP_API_URL` ya se lee de variables de entorno (`apiClient.js:3`, migración reciente) y no se propone tocar ese mecanismo.
- **Superficie de ataque afectada**: ninguna. Este spec es puramente de rendimiento de carga/render; cualquier cambio de code splitting es transparente al backend y a la superficie de autenticación.

---

## Dependencias

### Internas

- **`BUG-001`** (backlog, Crítica, Pendiente): `AuthProvider` no está montado en `App.jsx`/`index.js`. **Bloqueante para medir** — la app no monta hoy (`CartProvider` llama `useAuth()` y lanza excepción sin `AuthProvider`). Cualquier medición real (Lighthouse, navegación manual, DevTools) requiere que `BUG-001` esté resuelto primero, o medir contra una rama de trabajo que lo corrija como parte de la implementación de este pendiente (a decidir por `architecture-reviewer`).
- **`BUG-002`** (backlog, Crítica, Pendiente): `CartContext.jsx:85` usa `items.product_id` en vez de `item.product._id` dentro de `addItem`. Afecta directamente el mismo archivo (`CartContext.jsx`) que este spec identifica como candidato a optimización de render (ver `## Decisiones de Diseño → Optimización de render`). Cualquier cambio de memoización sobre `CartContext.jsx` debe coordinarse con la corrección de este bug para no enmascararlo ni generar conflictos de merge.
- **`BUG-003`** (backlog, Crítica, Pendiente): `CartContext.jsx` mezcla `cartid`/`cartId` como nombres de estado inconsistentes. Mismo archivo, mismo riesgo de conflicto que `BUG-002`.
- **`BUG-006`** (backlog, Alta, Pendiente): `ProductCard.jsx:9`, `ProductDetails.jsx:99` y `CartView.jsx:20` leen `product.imagesUrl` (array); el campo real del modelo `Product` es `imageURL` (string). Se confirmó además en `ecommerce-api/src/seed/productsCategories.js:71-135` que el propio seed escribe `imagesUrl` (plural, minúscula), un campo que no existe en el schema Mongoose de `Product` — Mongoose lo descarta silenciosamente. **Efecto medible**: ningún producto real muestra su imagen real hoy; todo cae al placeholder SVG (`/img/products/placeholder.svg`) o, en `CartView.jsx:20`, directamente puede lanzar un runtime error (`product.imagesUrl[0]` sin optional chaining, sin fallback) si `imagesUrl` es `undefined`. **Esto bloquea cualquier optimización real de "carga de imágenes"**: no tiene sentido optimizar formato/lazy-loading/responsive images de URLs que nunca se resuelven a una imagen real del catálogo. Ver `## Decisiones de Diseño → Carga de imágenes`.
- **`TEST-003` a `TEST-012`** (backlog): páginas y componentes de frontend sin test dedicado. Ver `## Riesgos y Deuda Técnica` (CA-7).
- **`TEST-014`** (backlog): cobertura real medida 33.79% statements / 23.52% branches / 24% functions / 34.99% lines.
- **`TEST-019`** (backlog): evaluación pendiente de `package.json` raíz — no bloqueante para este spec, pero cualquier cambio a scripts de `ecommerce-app/package.json` (por ejemplo, para el plan de medición) debe mantenerse consistente con esa decisión futura.

### Externas

- Ninguna dependencia externa nueva. Este spec **no** propone agregar `react-router-dom` (ya está en `^7.9.4`, compatible con `React.lazy`/`Suspense` sin cambios), ni TanStack Query, ni `source-map-explorer`/`webpack-bundle-analyzer` (no instalados hoy — ver `## Decisiones de Diseño → Plan de medición` para la justificación de no incluirlos en el alcance de medición base), ni Service Worker (no registrado hoy — confirmado: no existe ningún archivo `serviceWorkerRegistration.js` ni registro de `navigator.serviceWorker` en `src/`).

---

## Decisiones de Diseño

### 1. Lazy loading por ruta (CA-1)

Rutas reales montadas en `src/components/App/App.jsx` (líneas 24-82), evaluadas una por una contra el criterio "¿es necesaria en el primer render de `/`?":

| Ruta | Página (archivo) | Tamaño fuente | ¿Candidata a `React.lazy`? | Justificación |
|---|---|---|---|---|
| `/` | `pages/Home.jsx` | 2.1 KB | **No** | Ruta de entrada por defecto; es el contenido above-the-fold para la mayoría de las visitas. Ver `## Decisiones de Diseño → Qué no se toca`. |
| `/cart` | `pages/Cart.jsx` | 2.4 KB | Sí (prioridad media) | No se visita en el primer render salvo que el usuario navegue directo a `/cart`; su peso propio es bajo pero arrastra `CartView` y `Icon` (ya cargados por el layout, sin costo adicional real). |
| `/login` | `pages/Login.jsx` → `LoginForm.jsx` | Bajo | Sí (prioridad baja) | No es la ruta de entrada típica; beneficio marginal dado su tamaño pequeño, pero reduce JS del bundle principal. |
| `/search` | `pages/SearchResults.jsx` → `SearchResultsList.jsx` | Medio | Sí (prioridad media) | Solo se alcanza tras interacción explícita (buscar). |
| `/product/:productId` | `pages/Product.jsx` → `ProductDetails.jsx` | Medio | Sí (prioridad alta) | Alcanzable desde cualquier `ProductCard`, pero no es la ruta de entrada; separar reduce el bundle inicial para todo usuario que solo navega el catálogo. |
| `/category/:categoryId` | `pages/CategoryPage.jsx` → `CategoryProducts.jsx` | Medio | Sí (prioridad alta) | Mismo razonamiento que `ProductDetails`. |
| `/profile` (protegida) | `pages/Profile.jsx` → `ProfileCard.jsx` | Bajo | Sí (prioridad media) | Requiere auth; nunca se visita en el primer render de un usuario anónimo. |
| `/checkout` (protegida) | `pages/Checkout.jsx` | **13.7 KB, la página más pesada del proyecto** (`Checkout.jsx`, 436 líneas) | **Sí (prioridad más alta)** | Requiere auth y un carrito no vacío (`Checkout.jsx:54-60` redirige a `/cart` si está vacío); es la página con más lógica y más imports (`AddressForm`, `AddressList`, `PaymentForm`, `PaymentList`, `SummarySection`, `paymentService`, `shippingService`) de todo el proyecto. Es el candidato de mayor impacto en bytes. |
| `/wishlist` (protegida) | `pages/WishList.jsx` | Trivial — `export default function WishList() {}` (archivo vacío, sin JSX) | Sí (prioridad baja) | Componente vacío hoy; el beneficio actual es mínimo, pero se documenta como candidato para cuando se implemente (ver `## Pendientes Abiertos y Gaps Detectados` y `TEST-009`). |
| `/orders` (protegida) | `pages/Orders.jsx` | 8.9 KB | Sí (prioridad media-alta) | Solo alcanzable autenticado; lógica no trivial (formateo, `useMemo`, listas). |
| `/order-confirmation` | `pages/OrderConfirmation.jsx` | 3.8 KB | Sí (prioridad media) | Solo se alcanza vía `navigate(..., { state: { order } })` desde `Checkout.jsx:275`; nunca es entrada directa útil sin ese `state`. |
| `/settings` (protegida, **declarada dos veces**, líneas 66-73 y 74-81 de `App.jsx`) | `pages/Setttings.jsx` (nombre de archivo con triple "t", ya documentado en `.claude/CLAUDE.md`) | Trivial — `export default function Settings() {}` (archivo vacío) | Sí (prioridad baja) | Mismo caso que `WishList`: componente vacío. Se reporta además la **ruta duplicada** (`/settings` aparece dos veces con el mismo elemento) como hallazgo de calidad de código fuera del alcance de este spec — no se corrige aquí, se documenta. |
| `*` (catch-all) | `<div>Ruta no encontrada</div>` inline | Trivial | No | Es un `<div>` inline en `App.jsx`, no un componente separado; no hay nada que lazy-cargar. |

**Hallazgo adicional relevante para CA-1**: `pages/Register.jsx` (que envuelve `RegisterForm.jsx`) **no está montado en ninguna ruta de `App.jsx`**. `Header.jsx:95-99` tiene un botón "Crear Cuenta" cuyo `handleRegister` solo hace `console.log("Redirigir a registro")` y cierra el menú — no navega. `LoginForm.jsx:102` sí enlaza a `<Link to="/register">`, que hoy caería en la ruta catch-all (`Ruta no encontrada`). Se documenta como hallazgo (código muerto / ruta faltante), no se corrige en este spec — ver `## Riesgos y Deuda Técnica`.

**Hallazgo adicional**: `pages/PurchaseOrder.jsx` no se importa desde ningún otro archivo del proyecto (confirmado con búsqueda global) — es código completamente muerto, con datos hardcodeados de ejemplo (`addressList`, `paymentMethodList`). No aporta bytes al bundle de producción porque Webpack hace tree-shaking de módulos no importados, pero se documenta como candidato a limpieza fuera de este spec.

### 2. Lazy loading por componente (CA-2)

Se inspeccionó `ecommerce-app/src/components/` completo. **No existen** en el proyecto: librerías de gráficos (charts), tablas de datos (data grids), editores de texto enriquecido, ni componentes de modal genérico reutilizable. Los "overlays" existentes (`mobile-search-overlay` y `mobile-menu-overlay` en `Header.jsx:145-175` y `363-519`) son bloques JSX condicionales dentro del propio `Header.jsx`, no componentes ni módulos separados — no son extraíbles a un chunk propio sin refactorizar `Header.jsx` primero, y `Header` es parte del layout crítico (ver punto 3). **Conclusión: CA-2 no aplica — se documenta explícitamente que no hay candidatos de este tipo en el estado actual del código.**

### 3. Qué NO debe ir en lazy loading (CA-3)

- `layout/Header/Header.jsx`, `layout/Navigation/Navigation.jsx`, `layout/Footer/Footer.jsx`, `layout/Layout.jsx`: se renderizan en **cada** ruta (`Layout.jsx:10-17` envuelve `{children}` con `Header`/`Footer` fuera de `<Routes>` en `App.jsx:22-84`). Son contenido above-the-fold por definición — lazy-cargarlos introduciría un salto de layout (CLS) visible en cada carga.
- `layout/Newsletter/Newsletter.jsx`: solo se monta en Home (`Layout.jsx:14`, condicionado a `isHome`), pero es visible sin scroll adicional en la carga inicial de `/`; no se lazy-carga porque duplicaría el trabajo de `React.lazy` para un componente pequeño (bajo beneficio, riesgo de loader visible).
- `pages/Home.jsx` y sus hijos directos de primer render: `components/BannerCarousel/BannerCarousel.jsx` (el carrusel principal, siempre visible al entrar a `/`) y el primer `List`/`ProductCard` renderizado. Lazy-cargar el punto de entrada por defecto de la aplicación contradice el objetivo de percepción de velocidad (empeora el first paint de la ruta más visitada).
- `components/common/*` (Button, Input, Icon, Badge, Loading, ErrorMessage): son átomos usados transversalmente por el layout crítico y por casi cualquier página lazy-cargada; separarlos en chunks propios generaría más round-trips de red sin beneficio, dado su tamaño reducido.
- `context/AuthContext.jsx`, `context/CartContext.jsx`, `context/ThemeContext.jsx`: los providers de contexto no son candidatos a `React.lazy` — deben estar disponibles de forma síncrona antes de que cualquier componente hijo (lazy o no) los consuma vía `useContext`.

### 4. Estrategia de caché (CA-4)

Estado actual verificado archivo por archivo:

- **`apiClient.js`** (`services/apiClient.js`): instancia única de axios, `baseURL` desde `REACT_APP_API_URL`, interceptor de request que adjunta `Authorization`, interceptor de response que clasifica errores (`classifyError`). **No implementa ningún tipo de caché, deduplicación de requests en vuelo, ni revalidación.** Cada llamada a `apiClient.get(...)` dispara una petición de red nueva, sin excepción.
- **`services/productsService.js`, `services/categoryService.js`**: wrappers delgados sobre `apiClient`, sin caché (patrón "servicio que llama a la API" documentado en `.claude/CLAUDE.md`, respetado tal cual).
- **`layout/Navigation/Navigation.jsx:18-36`**: llama a `getAllCategories()` en un `useEffect` con `[]` como dependencias. Como `Navigation` vive dentro de `Header`, que a su vez vive en `Layout` (fuera de `<Routes>`, `App.jsx:20-86`), `Header`/`Navigation` **no se desmontan entre cambios de ruta** — la lista de categorías se pide una sola vez por sesión de navegación del lado cliente. No hay sobre-fetching estructural aquí; no se identifica una ganancia real de agregar caché sobre este endpoint específico salvo para el caso de recarga completa de página (`F5`), donde de todas formas se perdería cualquier caché en memoria.
- **`pages/Home.jsx:15-36`**: llama a `getAllProducts()` cada vez que el componente se monta. A diferencia de `Navigation`, `Home` **sí se desmonta y remonta** cada vez que el usuario navega fuera de `/` y regresa (por ejemplo: Home → detalle de producto → volver a Home vía logo), disparando un refetch completo del catálogo sin ningún indicio de que los datos no cambiaron.
- **`components/CategoryProducts/CategoryProducts.jsx:17-42`** y **`components/SearchResultsList/SearchResultsList.jsx:18-43`**: mismo patrón — refetch completo en cada montaje/cambio de parámetro, sin caché.
- **`context/CartContext.jsx`**: el carrito se persiste en `localStorage` bajo la clave `"cart"` vía `writeLocalJSON`/`readLocalJSON` de `utils/storageHelpers.js` (líneas 15, 20). Esto **ya es** una forma de caché de cliente (persistencia entre sesiones del carrito local antes de sincronizar con el backend autenticado). No se propone tocar este mecanismo.
- **`utils/storageHelpers.js`**: expone `STORAGE_KEYS` (`addresses`, `payments`, `orders`) y helpers genéricos `readLocalJSON`/`writeLocalJSON`. Es usado hoy por `pages/Orders.jsx:35` (lee `STORAGE_KEYS.orders`) — un patrón de persistencia local para historial de pedidos que convive, sin integrarse, con el flujo real de `Checkout.jsx:270-275`, que crea la orden vía `POST /orders` contra la API y navega a `/order-confirmation` pasando el `order` por `location.state`, **sin escribir en `localStorage`**. Esto es una inconsistencia funcional preexistente (Orders.jsx lee de un storage que Checkout.jsx nunca escribe), documentada aquí porque es evidencia relevante para no proponer expandir el uso de `localStorage` como fuente de verdad de datos que en realidad vienen del backend — **no se corrige en este spec** (está fuera de alcance; es un gap funcional entre `Checkout` y `Orders`, no un problema de performance).

**Decisión**: no se justifica introducir TanStack Query ni ninguna librería de fetching/caché nueva. Razones:
1. El volumen de endpoints GET repetidos sin necesidad real es acotado (catálogo en `Home`, `CategoryProducts`, `SearchResultsList`, `ProductDetails`) — no hay evidencia de un problema de sobre-fetching generalizado ni de invalidación compleja entre vistas.
2. El patrón establecido en todo el proyecto (`.claude/CLAUDE.md → React → hooks y contextos`) es `useState`/`useEffect` por componente con contextos para estado compartido (`Cart`, `Auth`, `Theme`) — introducir una librería de server-state manejada por query-keys sería un cambio arquitectónico transversal, no un ajuste de performance acotado, y requeriría tocar prácticamente todos los componentes de fetching listados arriba.
3. La cobertura de test real es 33.79% (`TEST-014`) — introducir una dependencia nueva que cambia el modelo de fetching en componentes sin test dedicado (`TEST-003` a `TEST-012`) eleva significativamente el riesgo de regresión silenciosa.

**Se propone en su lugar** (a validar por `architecture-reviewer` antes de implementar): un caché en memoria, de vida igual a la sesión de la pestaña (no persistido en `localStorage`), acotado a `services/productsService.js` (`getAllProducts`, `getProductById`) y `services/categoryService.js` (`getAllCategories`, `getProductsByCategoryAndChildren`), con invalidación por TTL corto (ej. 60s) o invalidación manual tras mutaciones (`createProduct`/`updateProduct`/`deleteProduct`, aunque estas son rutas admin no usadas hoy desde el frontend visible). Esto sigue el patrón de servicio ya establecido (mismo archivo, misma forma de export) sin introducir un segundo mecanismo de fetching ni de estado global. **No se propone cachear `payment-methods` ni `addresses` en ningún nuevo mecanismo** (ver `## Consideraciones de Seguridad`).

**Service Worker**: confirmado que no existe ningún archivo de registro de Service Worker en `src/` (búsqueda `find src -iname "*serviceworker*"` sin resultados) ni referencia a `navigator.serviceWorker` en el código. No se justifica agregarlo: no hay requisito de soporte offline declarado por el usuario, y CRA no lo trae activo por defecto en este proyecto (el template opcional de PWA no fue adoptado). **Decisión: no aplica, no se agrega.**

### 5. Análisis de dependencias — imports pesados (CA-5)

`package.json` de `ecommerce-app` (`dependencies`):

```
axios ^1.16.0
react ^19.1.1
react-dom ^19.1.1
react-router-dom ^7.9.4
react-scripts 5.0.1
web-vitals ^2.1.4
```

No hay librerías de gráficos, fechas (`moment`/`dayjs`/`date-fns` — el proyecto usa `Intl.NumberFormat` y `Date` nativos en `Checkout.jsx:48-52`, `Orders.jsx:9-13`, `OrderConfirmation.jsx:28-32`, todos con formato nativo, sin dependencia externa), utilidades tipo `lodash`, ni UI kits (Material UI, Ant Design, etc.). **No hay librerías grandes hipotéticas que evaluar porque no existen en el proyecto — la superficie de optimización de dependencias externas es mínima.**

Hallazgo real (no hipotético) de bundle: `prop-types` se usa directamente en el código fuente (`components/BannerCarousel/BannerCarousel.jsx:2`, `components/common/Icon/Icon.jsx:1`, `layout/Breadcrumb/Breadcrumb.jsx:1`) pero **no está declarado en `dependencies` de `package.json`** — solo existe en `package-lock.json` como dependencia transitiva de `react-scripts`. Esto no es un problema de performance en sí, pero es una inconsistencia de gestión de dependencias que se documenta como hallazgo (no se corrige aquí).

Hallazgo real de bundle interno (no una librería externa, pero sí "import pesado" en términos de bytes de código propio): `components/common/Icon/Icon.jsx` es un único archivo de 816 líneas que contiene **todos** los iconos SVG del proyecto (~60 iconos) embebidos como JSX inline en un objeto `icons`. Se importa de forma síncrona (no lazy) desde `Header.jsx`, `Footer.jsx`, `Navigation.jsx`, `ProductCard.jsx` (indirectamente vía `Badge`/`Button` no, pero directamente en otros), `CartView.jsx`, `BannerCarousel.jsx`, `Breadcrumb.jsx`, etc. Como es consumido desde el layout crítico (`Header`/`Footer`/`Navigation`, no lazy-cargables per punto 3), **todo el archivo de 816 líneas siempre viaja en el bundle principal**, independientemente de cuántos de los ~60 iconos use realmente una página dada. No se propone dividir `Icon.jsx` por icono individual en este spec (cambiaría la API pública del componente y tocaría ~10 archivos consumidores sin test dedicado), pero se documenta como el hallazgo de mayor bytes-por-archivo dentro del propio código fuente, candidato a evaluación futura (por ejemplo, tree-shaking real separando cada icono en su propio módulo, o adoptar sprites SVG).

### 6. Carga de imágenes (CA de contexto, cubierta implícitamente por CA-1/CA-5)

Estado real verificado:

- `components/ProductCard/ProductCard.jsx:34-41`: `<img src={imagesUrl ? imagesUrl[0] : "/img/products/placeholder.svg"} ... onError={...} />` — **sin** atributo `loading="lazy"`.
- `components/ProductDetails/ProductDetails.jsx:116-122`: mismo patrón, **sin** `loading="lazy"`.
- `components/Cart/CartView.jsx:20`: `<img src={product.imagesUrl[0]} alt={product.name} loading="lazy" />` — **sí** tiene `loading="lazy"` (único lugar del proyecto que ya lo usa), pero **sin fallback ni optional chaining**: si `product.imagesUrl` es `undefined` (que es el caso real hoy por `BUG-006`), esta línea puede lanzar `TypeError: Cannot read properties of undefined (reading '0')` en tiempo de ejecución.
- Se confirmó en `ecommerce-api/src/seed/productsCategories.js:71-135` que el seed escribe `imagesUrl: ["./img/products/<nombre>.{jpg,jpeg,png,avif}"]`, campo que **no existe** en el schema Mongoose de `Product` (el campo real es `imageURL`, string único — ver `.claude/CLAUDE.md → Modelos Mongoose → Product`). Mongoose descarta el campo desconocido al guardar. Resultado: en la base de datos real, `Product.imageURL` queda en su valor `default: "https://placehold.co/600x400"` para todo producto sembrado por este script, y el frontend, que además busca el campo equivocado (`imagesUrl`, no `imageURL`), nunca lo encuentra — doble desalineación, documentada previamente solo del lado frontend en `BUG-006`; esta auditoría confirma que el problema también está presente en el seed del backend.
- Los archivos de imagen reales existen físicamente en `ecommerce-app/public/img/products/` (copiados a `build/img/products/` en el build de producción) con pesos entre 2.5 KB (`Sony WH-1000XM5.avif`) y 185 KB (`applewatch9.png`) — el archivo PNG de 185 KB y el JPG de 168 KB (`Google Pixel 7.jpg`) son los más pesados y buenos candidatos a reconversión a formatos modernos (ya hay dos ejemplos `.avif` en el propio directorio, con pesos hasta 10x menores que sus equivalentes JPG/PNG), pero **hoy esos archivos no se sirven a ningún usuario real** porque el campo que los referenciaría (`imagesUrl`) nunca llega poblado al frontend por las razones anteriores.

**Conclusión de imágenes**: optimizar carga de imágenes de producto (formatos, `loading="lazy"` consistente, `srcset`/tamaños responsive) **depende directamente de que `BUG-006` (y el hallazgo de seed aquí confirmado) se resuelvan primero**. Hacerlo antes sería optimizar código muerto. Se documenta como acción de bajo esfuerzo y alto valor **una vez resuelto `BUG-006`**: agregar `loading="lazy"` a `ProductCard.jsx:34` y `ProductDetails.jsx:116` (consistente con lo que ya existe en `CartView.jsx:20`), y corregir el fallback de `CartView.jsx:20` para que no lance excepción si la imagen falta.

### 7. Optimización de render (memo/useMemo/useCallback)

Estado real verificado con búsqueda exhaustiva (`grep -rn "React.memo\|useCallback\| memo(" src/` y `grep -rn "useMemo" src/`):

- **`React.memo`**: cero usos en todo el proyecto.
- **`useCallback`**: cero usos en todo el proyecto.
- **`useMemo`**: 4 usos totales — `context/CartContext.jsx:68` (`count`), `context/CartContext.jsx:73` (`total`), `context/ThemeContext.jsx:31` (`value` del contexto), `pages/Orders.jsx:49` (`selectedOrder`). Los cuatro están justificados: son valores derivados de listas/objetos que cambian con cierta frecuencia y se consumen en múltiples lugares. **No hay evidencia de memoización indiscriminada existente** — el problema actual, si acaso, es el opuesto: falta de memoización donde sí hay evidencia de impacto real (ver siguiente punto).

**Hallazgo real y justificado para optimización futura**: `context/CartContext.jsx:140-150` construye el objeto `value` del `CartContext.Provider` **sin `useMemo`**, y las funciones `addItem`, `updateQuantity`, `removeItem`, `clearCart` (líneas 78-106) se recrean en cada render **sin `useCallback`**. Como `CartProvider` envuelve toda la aplicación (`App.jsx:20-86`) y su estado (`items`) cambia en operaciones frecuentes (agregar/quitar/actualizar cantidad), **cada cambio de carrito re-renderiza a todos los consumidores de `useCart()`**, incluyendo cada `ProductCard` visible en una grilla (`List.jsx` renderiza hasta 50 `ProductCard` en `CategoryProducts.jsx:25` con `limit: 50`, hasta 30 en `SearchResultsList.jsx:27`), aunque la mayoría de esos `ProductCard` solo usan `addItem` (una función) y no leen `items`/`count`/`total` directamente. Esto es un candidato real, medible y justificado a `useMemo`+`useCallback` en `CartContext.jsx` — **pero está en el mismo archivo que `BUG-002` y `BUG-003` (backlog, ambos Crítica)**, por lo que cualquier trabajo de memoización sobre este archivo debe secuenciarse con la corrección de esos bugs (ver `## Dependencias`), para evitar tocar las mismas líneas en paralelo o enmascarar los bugs existentes con un refactor de memoización.

No se identifican otros candidatos justificados a `React.memo` en componentes de lista (`ProductCard` en sí) sin antes resolver el punto anterior de `CartContext`, ya que memoizar `ProductCard` con `React.memo` no tiene efecto si el `value` del contexto que consume (`useCart()`) cambia de identidad en cada render de todas formas.

### 8. Plan de medición antes/después (CA-6)

Herramientas usadas: únicamente las ya presentes en el proyecto — `npm run build` (`react-scripts build`, que imprime automáticamente la tabla de tamaños gzip por archivo) y Lighthouse integrado en Chrome DevTools (no requiere instalación, viene con cualquier Chromium). No se agregan `source-map-explorer` ni `webpack-bundle-analyzer` como dependencias nuevas en este spec — si se necesitan para un análisis más profundo en la fase de implementación, esa decisión le corresponde a `architecture-reviewer`.

**Baseline capturado el 2026-07-21** (artefactos existentes en `ecommerce-app/build/`, generados por `npm run build` sobre el estado actual del código):

| Métrica | Valor baseline |
|---|---|
| `main.js` (bundle principal) | 375,934 bytes raw / 114,261 bytes gzip |
| Chunks adicionales | 1 chunk residual de Webpack, 4,441 bytes raw / 1,747 bytes gzip (no originado por `React.lazy` — no existe ninguno hoy) |
| `main.css` | 72,135 bytes raw / 12,178 bytes gzip |
| Rutas con `React.lazy` | 0 de 13 rutas montadas |
| Componentes con `React.memo` | 0 |
| Hooks `useCallback` | 0 |

**Procedimiento antes/después para la fase de implementación:**

1. `npm run build` antes de cualquier cambio → registrar tamaños de `build/static/js/*.js` (raw y gzip, con `gzip -c archivo | wc -c`) y cantidad de chunks generados. (Ya ejecutado como baseline arriba.)
2. Aplicar los cambios de `React.lazy`/`Suspense` priorizados en `## Decisiones de Diseño → 1. Lazy loading por ruta`.
3. `npm run build` después de los cambios → comparar: (a) tamaño de `main.js` (debe reducirse, ya que el código de rutas lazy sale del bundle principal a chunks propios), (b) cantidad de chunks nuevos (debe ser ≥ cantidad de rutas convertidas a `React.lazy`), (c) tamaño total sumado de todos los chunks (debe ser comparable al `main.js` original menos overhead de `Suspense`/boundary, no debe crecer significativamente).
4. Lighthouse (panel "Performance" de Chrome DevTools, modo "Navigation", con throttling simulado por defecto) sobre `npm start` (`localhost:3000`) en dos escenarios: (a) carga de `/` (ruta de entrada, no debe empeorar — es contenido crítico no lazy), (b) carga de `/checkout` (la ruta más pesada, mayor candidata a mejora) — comparar métricas `Largest Contentful Paint`, `Total Blocking Time` y `Time to Interactive` antes/después. **Precondición obligatoria**: `BUG-001` debe estar resuelto (o la medición debe hacerse sobre una rama que lo incluya) para que la aplicación monte sin lanzar la excepción de `useAuth()` descrita en `## Contexto`.
5. Documentar los cuatro números (bundle `main.js` gzip, cantidad de chunks, LCP de `/`, LCP de `/checkout`) en la sección `## Resultados` de este spec al cerrarlo, con los valores antes/después lado a lado.

---

## Riesgos y Deuda Técnica

- **CA-7 (obligatorio por contexto de entrada)**: la gran mayoría de `ecommerce-app/src/pages` y `src/components` **no tiene test dedicado**. Confirmado contra el backlog: `TEST-003` (`Cart`/`CartView`), `TEST-004` (`Checkout/Address`), `TEST-005` (`Checkout/Payment`), `TEST-007` (`SummarySection`), `TEST-008` (`Orders`, `PurchaseOrder`, `OrderConfirmation`), `TEST-009` (`WishList`), `TEST-010` (`Profile`/`ProfileCard`), `TEST-011` (`AuthContext`), `TEST-012` (`CategoryProducts`/`SearchResultsList`/páginas wrapper) — todos "Pendiente". Cobertura real medida (`TEST-014`, 2026-07-19): **33.79% statements / 23.52% branches / 24% functions / 34.99% lines**, con solo 7 de ~35 componentes cubiertos. **Esto es exactamente el motivo por el que `PERF-001` requiere el veredicto de `architecture-reviewer` antes de que cualquier subagente implemente**: introducir `React.lazy`/`Suspense` boundaries y tocar `CartContext.jsx` (memoización) sobre componentes sin red de seguridad de tests eleva el riesgo de regresión silenciosa — un `Suspense` mal ubicado puede ocultar errores de carga, y una memoización mal aplicada en `CartContext` puede introducir bugs de sincronización de estado difíciles de detectar sin tests que los atrapen.
- `BUG-001` bloquea la medición real (ver `## Contexto` y `## Dependencias`) — la app no monta en su configuración actual de producción.
- `BUG-002`/`BUG-003` comparten archivo (`CartContext.jsx`) con el hallazgo de memoización de este spec (punto 7) — riesgo de conflicto de merge o de enmascarar bugs si se trabajan en paralelo sin coordinación.
- `BUG-006` (confirmado también del lado del seed del backend en esta auditoría) bloquea cualquier optimización real de carga de imágenes — ver punto 6.
- `pages/Register.jsx` no está montado en ninguna ruta (`App.jsx`); `LoginForm.jsx:102` enlaza a `/register`, que hoy resuelve al catch-all "Ruta no encontrada". No se corrige en este spec (fuera de alcance de performance), se reporta como hallazgo de ruta faltante.
- `pages/PurchaseOrder.jsx` es código completamente muerto (no importado desde ningún otro archivo). No aporta bytes al bundle final (tree-shaking), pero es deuda de mantenimiento.
- Ruta `/settings` está declarada dos veces en `App.jsx` (líneas 66-73 y 74-81) con el mismo elemento — inofensivo (react-router-dom usa la primera coincidencia) pero es ruido de código.
- Discrepancias documentales detectadas entre `.claude/CLAUDE.md` y el código real de `ecommerce-app/src/services/`: `paymentService.js` y `shippingService.js` llaman a `apiClient` (backend real) y **no** leen `data/paymentMethods.json`/`data/shipping-address.json` como describe `.claude/CLAUDE.md`; y `userService.js` (documentado en `.claude/CLAUDE.md` como "lee `data/users.json` (local)") **no existe** como archivo en `ecommerce-app/src/services/`. Se reportan aquí porque se descubrieron durante la inspección exhaustiva requerida por este spec; no se corrigen (`.claude/CLAUDE.md` es documentación base y su actualización requiere justificación explícita fuera del alcance de este pendiente — se reporta al orchestrator).
- `Breadcrumb.jsx` espera la prop `categories` (`Breadcrumb.jsx:6`), pero `ProductDetails.jsx:105-113` y `CategoryProducts.jsx:67-69` lo invocan pasando la prop `items` en su lugar — el breadcrumb nunca renderiza contenido real en esas dos páginas (cae en `categories = []` por defecto → `return null`, `Breadcrumb.jsx:7-9`). No relacionado con performance; se documenta por completitud ya que se detectó durante la lectura de los mismos archivos evaluados para lazy loading.
- Deuda técnica generada conscientemente por este spec: ninguna aún (es un documento de diagnóstico, no de implementación). La implementación derivada generará deuda medible que se documentará en su propio spec de implementación.

---

## Pendientes Abiertos y Gaps Detectados

> Esta sección se completa durante la implementación y es obligatoria antes del cierre.

- **Funcionalidades faltantes:** N/A — este spec no implementa funcionalidad, es diagnóstico.
- **Comportamientos inconsistentes detectados:** ver `## Riesgos y Deuda Técnica` (rutas duplicadas, `Register` no montado, `Breadcrumb` con prop mal nombrada, discrepancias entre `.claude/CLAUDE.md` y `services/*.js`).
- **Gaps entre frontend y backend:** `BUG-006` confirmado también en `ecommerce-api/src/seed/productsCategories.js` (campo `imagesUrl` no existe en el schema `Product`).
- **Persistencia pendiente de migrar:** N/A para este spec — no se toca la persistencia local existente (`storageHelpers.js`).
- **Decisiones aplazadas:** división de `Icon.jsx` en módulos por icono individual (evaluación futura, no en este spec); caché en memoria de `productsService.js`/`categoryService.js` (diseño propuesto aquí, implementación aplazada a fase posterior sujeta a `architecture-reviewer`).
- **Trabajo fuera de alcance en esta iteración:** implementación de `React.lazy`/`Suspense`, memoización de `CartContext.jsx`, corrección de `BUG-001`/`BUG-002`/`BUG-003`/`BUG-006`, limpieza de `PurchaseOrder.jsx`, montaje de ruta `/register`.
- **Riesgos que requieren seguimiento:** ejecución del plan de medición está bloqueada por `BUG-001` hasta su resolución.
- **Items que deben convertirse en backlog:** pendiente de definir junto con `architecture-reviewer` al cerrar este spec — candidatos: implementación de lazy loading por ruta (prioridad `/checkout` primero), memoización de `CartContext` (coordinada con `BUG-002`/`BUG-003`), corrección de `loading="lazy"` + fallback en `CartView.jsx`/`ProductCard.jsx`/`ProductDetails.jsx` (bloqueado por `BUG-006`), caché en memoria de catálogo/categorías.

---

## Resultados (se completa al cerrar)
- **Fecha de cierre:**
- **CAs cumplidos:**
- **CAs no cumplidos:**
- **Deuda técnica generada:**
- **Lecciones aprendidas:**
- **Pendientes abiertos confirmados:**
- **Gaps no resueltos:**
- **Trabajo fuera de alcance confirmado:**
- **Backlog derivado creado:**
- **Referencias a historias/tareas creadas:**

---

## Matriz de cierre

| Ítem detectado | Estado | Acción |
|---|---|---|
| | | |
