# Checklist — Frontend Definition of Done

> Usado por `frontend-builder` antes de reportar finalización y por `code-reviewer` al auditar.

---

## Providers y árbol de componentes

- [ ] `AuthProvider` wrappea `CartProvider` en `App.jsx`
- [ ] `CartProvider` está dentro de `AuthProvider` (nunca al revés)
- [ ] Los custom hooks tienen guard con `throw new Error("useX debe usarse dentro de <XProvider>")`
- [ ] No hay rutas duplicadas en `App.jsx`
- [ ] Las rutas protegidas usan `ProtectedRoute`

## Contextos y estado

- [ ] Los nombres de variables de estado son consistentes en todo el archivo de contexto
- [ ] No se mezclan `cartId` (camelCase) y `cartid` (lowercase) para la misma variable
- [ ] Los campos referenciados en el contexto existen en el schema del modelo correspondiente
  - Cart: `item.product._id` (no `item.product_id` ni `item.productId`)
  - Cart: `item.product` (no `item.productId`)

## Servicios y API

- [ ] Los servicios que llaman a la API usan `apiClient` (no `fetch` directamente)
- [ ] El `baseURL` de `apiClient.js` coincide con el puerto real del backend
- [ ] No se llama a rutas que no existen en el backend (verificar `CLAUDE.md` §mapa-de-rutas)
- [ ] Si el servicio lee un JSON local, está explícitamente marcado como provisional en el spec

## Auth y token

- [ ] El token se lee con `getToken()` de `src/utils/auth.js`
- [ ] Se verifica expiración con `isTokenExpired()` antes de usar el token
- [ ] El payload del token se accede con `decodeToken()` — campos: `userId`, `name`, `role`
- [ ] No se asumen otros campos en el payload del token

## Código limpio

- [ ] Sin `debugger` statements (verificar especialmente `Checkout.jsx`)
- [ ] Sin `console.log` de debug
- [ ] Sin `// TODO` no registrados en el backlog
- [ ] Sin código comentado

## Estructura y patrones

- [ ] Los nuevos componentes viven en su propia carpeta con `.jsx` y `.css`
- [ ] Los átomos en `src/components/common/` tienen su `index.js` de barrel export
- [ ] Los estilos son módulos CSS por componente (no estilos globales en `index.css`)

## Testing

- [ ] Los quality gates pasan: `cd ecommerce-app && npm test -- --watchAll=false`
- [ ] Los tests usan `userEvent` (no `fireEvent`)
- [ ] Los tests usan `getByRole`, `getByText`, `getByLabelText` (no acceden a internals)
- [ ] Los tests que usan contextos tienen `wrapper: AllProviders`
- [ ] Los tests de auth simulan el token con `localStorage.setItem("authToken", token)`

## Documentación

- [ ] El spec está actualizado: `## Resultados`, `## Pendientes Abiertos`, `## Matriz de cierre`
- [ ] Estado del spec: `DONE`
- [ ] El reporte de salida está listo para el orchestrator
