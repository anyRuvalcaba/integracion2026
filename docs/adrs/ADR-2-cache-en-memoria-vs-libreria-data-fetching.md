# ADR-2 — Caché en memoria en services existentes en vez de librería de data-fetching

**Fecha:** 2026-07-21
**Estado:** Aceptado
**Autores:** spec-writer (propuesta en `docs/specs/2026-07-21-perf-frontend-optimization.md`, `PERF-001`)
**Revisores:** architecture-reviewer + orchestrator

---

## Contexto

`PERF-001` audita performance de `ecommerce-app` y detecta refetching repetido sin necesidad real en `pages/Home.jsx`, `components/CategoryProducts/CategoryProducts.jsx` y `components/SearchResultsList/SearchResultsList.jsx`: cada montaje dispara una petición nueva a `GET /products` / `GET /categories` sin ningún indicio de que los datos no cambiaron. `services/apiClient.js` no implementa caché, deduplicación de requests en vuelo ni revalidación — cada llamada dispara una petición de red nueva.

El patrón de servicio establecido en el proyecto (`.claude/CLAUDE.md → Patrón de servicio que llama a la API`) es un wrapper delgado y sin estado sobre `apiClient`: recibe parámetros, llama a `apiClient.method(...)`, devuelve `response.data`. No hay precedente de estado ni de lógica de invalidación dentro de un archivo de `services/`.

Es necesario decidir cómo resolver el refetching innecesario sin comprometer la superficie de test (cobertura real 33.79%, `TEST-014`) ni introducir un segundo mecanismo de fetching paralelo a `apiClient.js`.

## Decisiones consideradas

### Opción 1 — TanStack Query (React Query)

Adoptar una librería de server-state con caché por query-key, revalidación automática, deduplicación de requests en vuelo e invalidación declarativa.

**Ventajas:**
- Resuelve caché, deduplicación, revalidación y estados de loading/error de forma estandarizada y probada.
- Reduce código boilerplate de `useEffect` + `useState` repetido en `Home.jsx`, `CategoryProducts.jsx`, `SearchResultsList.jsx`, `ProductDetails.jsx`.

**Desventajas:**
- Es un cambio arquitectónico transversal, no un ajuste de performance acotado: requeriría tocar prácticamente todos los componentes de fetching listados, todos sin test dedicado (`TEST-003` a `TEST-012`).
- Introduce un segundo modelo mental de manejo de datos (query-keys, `QueryClientProvider`) que convive con el patrón ya establecido de `useState`/`useEffect` + Context API para estado compartido (`.claude/CLAUDE.md → React → hooks y contextos`), fragmentando el patrón del proyecto.
- Eleva el riesgo de regresión silenciosa en componentes sin red de tests que la atrape.
- No hay evidencia de un problema de sobre-fetching generalizado ni de invalidación compleja entre vistas que justifique la sofisticación de la librería (no hay mutaciones optimistas, ni sincronización entre pestañas, ni datos que cambien con alta frecuencia fuera del carrito, que ya tiene su propio mecanismo).

### Opción 2 — Caché en memoria dentro de los services existentes

Agregar una caché en memoria (vive solo mientras la pestaña esté abierta, sin persistencia en `localStorage`) con TTL corto (~60s) dentro de `services/productsService.js` (`getAllProducts`, `getProductById`) y `services/categoryService.js` (`getAllCategories`, `getProductsByCategoryAndChildren`), con invalidación manual tras mutaciones admin.

**Ventajas:**
- Mantiene el patrón establecido: un único cliente HTTP (`apiClient.js`), servicios que exponen funciones async simples, sin introducir un segundo mecanismo de fetching ni de estado global.
- Acotado a los dos archivos de servicio donde se detectó evidencia real de refetching innecesario — no toca `CartContext.jsx`, `AuthContext.jsx` ni `storageHelpers.js`.
- No cachea `payment-methods` ni `addresses` (datos sensibles) — evita el riesgo de Information Disclosure identificado en el spec.
- Bajo riesgo de regresión: cambio contenido en dos archivos con interfaz pública (nombres de función, forma de retorno) sin alterar.

**Desventajas:**
- Duplica, en miniatura, un concepto (caché con TTL) que una librería ya resuelve de forma más robusta y testeada.
- Si el número de servicios con este mismo problema crece en el futuro, este patrón se repetiría manualmente en cada archivo de servicio, sin abstracción compartida — deuda técnica potencial si se expande antes de reconsiderar la Opción 1.

## Decisión

La opción elegida es: **Opción 2 — Caché en memoria dentro de `productsService.js` y `categoryService.js`**.

Justificación: el volumen de endpoints GET con refetching innecesario es acotado (catálogo y categorías, sin evidencia de sobre-fetching generalizado ni de necesidad de invalidación compleja entre vistas). Introducir TanStack Query sería un cambio arquitectónico transversal que tocaría casi todos los componentes de fetching del frontend, la mayoría sin test dedicado (`TEST-003` a `TEST-012`, cobertura real 33.79% — `TEST-014`), elevando significativamente el riesgo de regresión silenciosa para un problema de alcance acotado. La Opción 2 resuelve el problema real detectado sin fragmentar el patrón de servicios ya establecido en `.claude/CLAUDE.md`.

## Consecuencias

**Positivas:**
- No se agrega una dependencia nueva; `package.json` de `ecommerce-app` permanece sin cambios en `dependencies`.
- El patrón de servicio (`services/*.js` como wrapper delgado sobre `apiClient`) se mantiene consistente en el resto del proyecto; solo dos archivos ganan estado interno de caché.
- Reduce el riesgo de seguridad de una caché mal alcanzada: queda explícitamente prohibido cachear `payment-methods`/`addresses` en cualquier mecanismo nuevo.

**Negativas / riesgos asumidos:**
- `productsService.js` y `categoryService.js` dejan de ser wrappers 100% sin estado — introducen una excepción puntual y documentada al patrón "servicio sin estado" descrito en `.claude/CLAUDE.md`. Cualquier agente que lea esos dos archivos en el futuro debe saber que la excepción está documentada aquí, no es un error de patrón.
- Si en el futuro se detecta la necesidad de invalidación cross-componente más compleja (ej. sincronizar caché entre `Home` y `CategoryProducts` tras una mutación admin), este ADR debe revisarse y potencialmente reemplazarse por la Opción 1.

**Deuda técnica generada:**
- Ninguna nueva en el momento de este ADR (el spec `PERF-001` es diagnóstico, no implementación). La implementación derivada, cuando ocurra, hereda la obligación de: (a) TTL corto y configurable, (b) invalidación manual tras `createProduct`/`updateProduct`/`deleteProduct`/`createCategory`/`updateCategory`/`deleteCategory`, (c) nunca cachear `payment-methods` ni `addresses`.

## Módulos afectados

- `ecommerce-app/src/services/productsService.js`
- `ecommerce-app/src/services/categoryService.js`

## Relación con otros ADRs

- Depende de: ninguno.
- Reemplaza a: ninguno.
- Relacionado con: `ADR-1-politica-de-modelos.md` (sin relación directa de contenido, referenciado solo por numeración secuencial).

---

*ADR creado por `architecture-reviewer`. Aprobado por `orchestrator`.*
