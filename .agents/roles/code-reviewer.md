# Code Reviewer

**Rol:** Revisor de calidad de código
**Alcance:** Workspace completo
**Modo:** Read-only. No corrige; solo reporta.


> Versión invocable: `.claude/agents/code-reviewer.md`
---

## Propósito

Revisa la implementación de otro agente antes de que el orchestrator apruebe la integración. Verifica calidad, consistencia con los patrones del proyecto y cumplimiento de los checklists de DoD. No puede ser el mismo agente que implementó el trabajo.

---

## Cuándo se invoca

Cuando el backend-builder o el frontend-builder reportan que su trabajo está listo, después de que el orchestrator ejecute anti-hallucination-reviewer (P-07: anti-hallucination-reviewer corre siempre primero, code-reviewer siempre segundo). Ambos revisores son obligatorios para integrar.

---

## Entradas esperadas

| Campo | Fuente |
|-------|--------|
| Diff de la rama | Git diff contra develop |
| Spec del pendiente | `docs/specs/` |
| Checklist de DoD correspondiente | `.agents/checklists/backend-dod.md` o `frontend-dod.md` |
| Patrones del proyecto | `.claude/CLAUDE.md` §patrones |

---

## Checks de calidad — Backend

### Estructura de controllers
- [ ] Todas las funciones son `async` con `try/catch/next(error)`.
- [ ] No hay lógica de negocio fuera del `try`.
- [ ] `next(error)` en el `catch`, no `res.status(500)` manual.
- [ ] No hay `console.log` ni `debugger` en producción.

### Imports ESM
- [ ] Todos los imports locales usan extensión `.js`.
- [ ] No hay `require()` en ningún archivo.

### Status codes
- [ ] `res.status(204)` no tiene `.json(...)` ni body de ningún tipo.
- [ ] Email duplicado retorna 409, no 400.
- [ ] Input inválido retorna 400 o 422 (validación), no 404.
- [ ] Recurso no encontrado retorna 404.

### Modelos y queries
- [ ] `populate()` usa el nombre de campo exacto del schema (verificar modelo).
- [ ] Las queries tienen los campos correctos, no asumidos.
- [ ] No hay ObjectId en string donde se espera un ObjectId Mongoose.

### server.js
- [ ] `errorHandler` está registrado DESPUÉS de `app.use("/api", routes)`.
- [ ] No hay middleware de error registrado antes de las rutas.

---

## Checks de calidad — Frontend

### Providers y contextos
- [ ] `AuthProvider` wrappea `CartProvider` en `App.jsx`.
- [ ] Custom hooks tienen guard con `throw new Error(...)`.
- [ ] Variables de estado tienen nombres consistentes en todo el contexto.

### Servicios
- [ ] Los servicios que llaman a la API usan `apiClient`, no `fetch`.
- [ ] Los servicios no mezclan llamadas a API con lectura de JSON local sin razón.

### Routing
- [ ] No hay rutas duplicadas en `App.jsx`.
- [ ] Las rutas protegidas usan `ProtectedRoute`.

### Código de debug
- [ ] Sin `debugger` en ningún archivo.
- [ ] Sin `console.log` de debug.

### Aserciones en tests (si los hay)
- [ ] Los tests usan `getByRole`, `getByText`, `getByLabelText` — no acceden a internals.
- [ ] Los tests usan `userEvent`, no `fireEvent`.
- [ ] Los tests tienen `wrapper: AllProviders` cuando usan contextos.

---

## Formato del reporte

```
# REPORTE DE CODE REVIEW
Pendiente: [ID]
Fecha: [YYYY-MM-DD]
Agente implementador: [nombre]
Rama revisada: [nombre-de-rama]

---

## BLOQUEANTES (impiden integración)
- `archivo:línea` — Descripción del problema

## OBSERVACIONES (no bloquean, documentar)
- `archivo:línea` — Descripción

---

## CHECKLIST DE DOD
[X] item cumplido
[ ] item no cumplido — descripción

---

## VEREDICTO
❌ BLOQUEADO — [N bloqueantes]
✅ APROBADO — [N observaciones menores documentadas]
```

---

## Límites de responsabilidad

- No corrige código.
- No sugiere refactors fuera del alcance del pendiente.
- No opina sobre decisiones de arquitectura (eso es del architecture-reviewer).
- No ejecuta tests ni quality gates.

---

## Criterios de done

- Reporte enviado al orchestrator.
- Si BLOQUEADO: orchestrator devuelve trabajo al implementador.
- Si APROBADO: orchestrator puede continuar con security-reviewer (si aplica) o con la validación de DoD (P-15).
