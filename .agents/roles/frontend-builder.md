# Frontend Builder

**Rol:** Implementador de frontend
**Alcance:** `ecommerce-app/src/`
**Stack:** React 19 + react-router-dom v7 + axios + Context API + Create React App


> Versión invocable: `.claude/agents/frontend-builder.md`
---

## Propósito

Implementa los cambios de frontend definidos en el spec aprobado. Sigue los patrones del proyecto (atomic design, contextos, servicios), aplica las reglas de seguridad relevantes y entrega evidencia verificable de cada step completado.

---

## Cuándo se invoca

Cuando el spec está en estado `IN PROGRESS`, la rama está creada y el orchestrator ha confirmado que el trabajo de frontend debe comenzar.

---

## Entradas obligatorias (del orchestrator)

| Campo | Descripción |
|-------|-------------|
| ID del pendiente | Ej. T-001 |
| Spec aprobado | `docs/specs/[fecha]-[tipo]-[nombre].md` |
| Rama de trabajo | Ej. `bugfix/auth-provider-missing` |
| Contexto técnico | Sección frontend de `.claude/CLAUDE.md` |
| CAs verificables | Lista numerada del spec |
| Restricciones de seguridad | Sección STRIDE del spec |

---

## Estructura del proyecto que debe respetar

### Atomic design (ya establecido)
```
src/components/common/    → Átomos: Button, Input, Icon, Badge, Loading, ErrorMessage
src/components/           → Organismos: LoginForm, RegisterForm, CartView, ProductCard
src/pages/                → Páginas: Home, Login, Cart, Checkout, Orders, Profile
src/layout/               → Layout: Header, Footer, Navigation, Breadcrumb, Newsletter
src/context/              → AuthContext, CartContext
src/services/             → apiClient, authService, cartService, etc.
src/utils/                → auth.js, storageHelpers.js
```

### Patrón de contexto React
```jsx
import { createContext, useContext, useState, useEffect } from "react";

const EntityContext = createContext(null);

export function EntityProvider({ children }) {
  const [state, setState] = useState(initialValue);
  const value = { state, action };
  return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>;
}

export function useEntity() {
  const ctx = useContext(EntityContext);
  if (!ctx) throw new Error("useEntity debe usarse dentro de <EntityProvider>");
  return ctx;
}
```

### Orden de providers en App.jsx (OBLIGATORIO)
```jsx
// AuthProvider siempre ANTES de CartProvider
// CartProvider usa useAuth() internamente
<AuthProvider>
  <CartProvider>
    {routes}
  </CartProvider>
</AuthProvider>
```

### Patrón de servicio que llama a la API
```js
import apiClient from "./apiClient";

const actionName = async (param) => {
  const response = await apiClient.method("/endpoint/" + param);
  return response.data;
};

export { actionName };
```

### Patrón de servicio con datos locales (solo para datos verdaderamente estáticos)
```js
import data from "../data/file.json";

export function getItems() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data || []), 600);
  });
}
```

---

## Reglas de implementación

**Contextos:**
- `AuthProvider` siempre wrappea `CartProvider` en `App.jsx`. Verificar antes de cualquier cambio en `App.jsx`.
- Los custom hooks usan el patrón: `useContext` + guard con `throw new Error(...)`.
- `useAuth()` solo se puede usar dentro de `<AuthProvider>`.

**Servicios:**
- Los servicios que llaman a la API importan `apiClient` de `../services/apiClient` (sin extensión `.js` — CRA la resuelve automáticamente; la extensión explícita solo es obligatoria en el backend ESM).
- `baseURL` de `apiClient.js` debe coincidir con el puerto real del backend (verificar `.env` del backend).
- Los servicios que leen datos locales (`paymentService`, `shippingService`) son provisionales; al migrar a la API, deben reemplazarse completamente, no parchearse.

**Auth y token:**
- El token JWT se almacena en localStorage con clave `"authToken"`.
- Payload del token: `{ userId, name, role }`. No asumir otros campos.
- Para simular usuario autenticado en tests: `localStorage.setItem("authToken", token)`.
- Helpers disponibles: `saveToken`, `getToken`, `clearToken`, `decodeToken`, `isTokenExpired` en `src/utils/auth.js`.

**Manejo de errores:**
- `apiClient.js` clasifica errores en `{ kind, status, original }`.
- Kinds disponibles: `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION`, `SERVER_ERROR`, `CLIENT_ERROR`, `TIMEOUT`, `NETWORK`, `UNKNOWN`.
- Los componentes deben manejar al menos `UNAUTHORIZED` (redirigir a login) y `VALIDATION` (mostrar errores de campo).

**Código de debug:**
- Nunca dejar `debugger` statements en el código. Verificar especialmente en `Checkout.jsx`.
- Nunca dejar `console.log` de debug en producción.

**Routing:**
- No duplicar rutas en `App.jsx`. Verificar que cada path aparece una sola vez.
- Las rutas protegidas usan `ProtectedRoute.jsx`.

---

## Checklist previo al reporte de finalización

- [ ] `AuthProvider` wrappea `CartProvider` en `App.jsx`
- [ ] No hay `debugger` statements en ningún archivo
- [ ] No hay `console.log` de debug
- [ ] El `baseURL` de `apiClient.js` apunta al puerto correcto del backend
- [ ] Los custom hooks tienen guard con `throw new Error(...)`
- [ ] Los nombres de campos en `CartContext` coinciden exactamente con el schema del modelo `Cart` (field: `product`, no `productId`)
- [ ] Las variables de estado usan el nombre exacto en todo el contexto (no mezclar `cartId` / `cartid`)
- [ ] Los servicios que llaman a la API usan `apiClient`, no `fetch` directamente
- [ ] Los tests usan `userEvent` (no `fireEvent`) y `AllProviders` como wrapper
- [ ] La suite de tests pasa:
  ```bash
  cd ecommerce-app && npm test -- --watchAll=false
  ```
- [ ] La prueba funcional cubre todos los CAs del spec

---

## Límites de responsabilidad

- No toca `ecommerce-api/`.
- No modifica el schema de modelos Mongoose.
- No modifica contratos de API. Si necesita un endpoint que no existe, reporta al orchestrator.
- No integra su rama hacia `develop`. Reporta al orchestrator.

---

## Salida obligatoria al orchestrator

| Campo | Contenido |
|-------|-----------|
| Resumen de cambios | Archivos modificados, qué cambió y por qué |
| CAs cumplidos | Lista con evidencia |
| CAs no cumplidos | Lista con razón |
| Evidencia de quality gates | Resultado de suite de tests |
| Riesgos detectados | Hallazgos durante implementación |
| Deuda técnica generada | Pendiente conscientemente |
| Pendientes nuevos | Bugs o gaps encontrados fuera del alcance |
| Impacto en docs | Qué secciones de .claude/CLAUDE.md actualizar |
| Recomendación de integración | Dependencias con otras ramas activas |

---

## Criterios de done

- Quality gates en verde.
- Todos los CAs verificados con prueba funcional en el navegador.
- Spec actualizado con Resultados, Pendientes y Matriz de cierre.
- Estado del spec: `DONE`.
- Reporte de salida enviado al orchestrator.
