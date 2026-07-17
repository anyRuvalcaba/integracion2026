# Workflow — Feature Flow

**Tipo:** feature
**Trigger:** Ítem de backlog clasificado como Feature o Feature faltante
**Referencia:** SSDLC v2.0.0 FASES 0–10

---

## Secuencia de agentes

```
orchestrator
  │
  ├─ 1. spec-writer          → docs/specs/[fecha]-feature-[nombre].md
  │
  ├─ 2. architecture-reviewer → aprobación o ADR si hay cambio arquitectónico
  │
  ├─ 3. qa-test-designer      → docs/test-plans/[ID]-[nombre].md
  │
  ├─ 4. backend-builder       → implementa en ecommerce-api/ (si aplica)
  │   └─ o frontend-builder   → implementa en ecommerce-app/ (si aplica)
  │   └─ o ambos en paralelo si el orchestrator lo autoriza
  │
  ├─ 5. anti-hallucination-reviewer → aprobación o hallucinations (P-07, siempre primero)
  │
  ├─ 6. code-reviewer         → aprobación o bloqueantes (P-07, siempre segundo)
  │
  ├─ 7. security-reviewer     → aprobación o vulnerabilidades (P-07, solo si aplica)
  │
  ├─ 8. orchestrator          → valida DoD completo (.agents/protocols/dod-loop.md)
  │
  ├─ 9. pr-publisher          → abre el PR contra develop usando pr-template.md
  │
  ├─ 10. tech-reviewer         → audita el PR ya abierto → APTO | CAMBIOS
  │      (si CAMBIOS: vuelve al loop de dod-loop.md con el implementador señalado)
  │
  └─ 11. orchestrator          → mergea + docs-keeper
```

---

## Paso a paso

### 1. Orchestrator — Selección y contexto
- Lee `docs/backlog.md` y selecciona el feature según prioridad.
- Verifica que no hay rama activa para este ítem.
- Prepara el contexto completo de entrada (tabla de 9 campos del SSDLC).
- Invoca `spec-writer`.

### 2. Spec Writer — Spec del feature
- Redacta el spec en `docs/specs/`.
- Verifica que los endpoints y modelos referenciados existen en el código real o están explícitamente marcados como "a crear".
- Commite el spec en `develop`.
- El orchestrator revisa y aprueba antes de continuar.

### 3. Architecture Reviewer — Validación arquitectónica
- Obligatorio si el feature crea un nuevo modelo, nuevo endpoint, nueva relación o cambia el manejo de estado.
- Si hay desvío arquitectónico: crea ADR antes de aprobar.
- Opcional si el feature es puramente de presentación (componente UI sin nueva lógica de negocio).

### 4. QA Test Designer — Plan de pruebas
- Diseña los casos basados en los CAs del spec y los validadores del módulo.
- Commite el plan en la misma rama que se abrirá para implementar.

### 5. Implementadores — Backend y/o Frontend
- Crean la rama desde `develop` actualizado.
- Implementan siguiendo sus respectivos documentos de rol.
- Ejecutan quality gates.
- Completan el spec (Resultados, Pendientes, Matriz de cierre).
- Reportan al orchestrator con la salida obligatoria.

### 6. Revisores — Hallucinations, calidad, seguridad
El orden es el de P-07 (`.agents/protocols/global-rules.md`). Cualquiera puede bloquear:
- `anti-hallucination-reviewer` primero, siempre (referencias inventadas).
- `code-reviewer` segundo, siempre (calidad y patrones).
- `security-reviewer` tercero, solo si hay auth, modelos o datos sensibles.
- `architecture-reviewer` ya corrió en el paso 3 si aplicaba cambio arquitectónico; no se repite aquí salvo que un revisor posterior detecte una desviación nueva.

### 7. Orchestrator — Validación de DoD
- Verifica todos los reportes de revisores.
- Evalúa el DoD completo (`.agents/checklists/backend-dod.md` / `frontend-dod.md` / `pr-checklist.md`) ítem por ítem según `.agents/protocols/dod-loop.md` (P-15).
- Si algún ítem falla: despacha la remediación al agente responsable según la tabla de `dod-loop.md`. Tope de 3 iteraciones antes de escalar al usuario.

### 8. PR Publisher — Apertura del PR
- Llena `.agents/templates/pr-template.md` transcribiendo datos ya producidos por spec, quality gates y revisores.
- Ejecuta `gh pr create --base develop`.
- Si falta algún dato, lo marca `FALTA: <dato>` y reporta al orchestrator en vez de inventar.

### 9. Tech Reviewer — Auditoría del PR abierto
- Compara los claims del PR (CAs, quality gates marcados) contra evidencia real (`gh pr diff`, spec).
- Evalúa riesgo de integración.
- Emite veredicto **APTO** o **CAMBIOS**. Si CAMBIOS, el orchestrator vuelve al loop de `dod-loop.md` con el implementador señalado.

### 10. Orchestrator — Integración y Docs Keeper
- Con `tech-reviewer` = APTO, mergea el PR a `develop`.
- Invoca `docs-keeper`, que actualiza `CLAUDE.md` con los cambios del feature y `docs/backlog.md`, y commitea en `develop`.

---

## Criterios de done del workflow completo

- PR mergeado a `develop`.
- Spec en estado `DONE` con todos los campos completos.
- `docs/backlog.md` actualizado.
- `CLAUDE.md` actualizado si hubo cambios en modelos, rutas o estructura.
- Sin ramas del feature abiertas sin mergear.
