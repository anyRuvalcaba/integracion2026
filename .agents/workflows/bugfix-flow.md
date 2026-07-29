# Workflow — Bugfix Flow

**Tipo:** bugfix
**Trigger:** Ítem de backlog clasificado como Bug
**Referencia:** SSDLC v2.0.0 FASES 0–10 (versión acelerada para bugs conocidos)

---

## Diferencias respecto al Feature Flow

| Aspecto | Feature Flow | Bugfix Flow |
|---------|-------------|-------------|
| architecture-reviewer | Siempre si hay cambio arq. | Solo si la corrección cambia un contrato |
| qa-test-designer | Siempre | Solo si el bug no tenía test que lo capturara |
| Velocidad | Normal | Acelerada (menos overhead documental) |
| Rama | `feature/nombre` | `bugfix/nombre` |

---

## Secuencia de agentes

```
orchestrator
  │
  ├─ 1. spec-writer          → spec de bugfix (más breve que feature)
  │
  ├─ 2. backend-builder      → corrige en ecommerce-api/ (si aplica)
  │   └─ o frontend-builder  → corrige en ecommerce-app/ (si aplica)
  │
  ├─ 3. anti-hallucination-reviewer → obligatorio siempre
  │
  ├─ 4. code-reviewer         → obligatorio siempre
  │
  ├─ 5. security-reviewer     → solo si el bug tiene impacto de seguridad
  │
  ├─ 6. orchestrator          → valida DoD completo (.agents/protocols/dod-loop.md)
  │
  ├─ 7. pr-publisher          → abre el PR contra develop usando pr-template.md
  │
  ├─ 8. tech-reviewer         → audita el PR ya abierto → APTO | CAMBIOS
  │      (si CAMBIOS: vuelve al loop de dod-loop.md con el implementador señalado)
  │
  └─ 9. orchestrator          → mergea + docs-keeper (solo si el bugfix cambia documentación)
```

---

## Paso a paso

### 1. Spec Writer — Spec de bugfix
El spec de un bugfix es más breve que el de un feature pero igualmente obligatorio:
- Describe el comportamiento actual (incorrecto) y el comportamiento esperado (correcto).
- Lista los CAs: al menos "el bug no se reproduce" y "el comportamiento correcto se verifica".
- Documenta el riesgo de la corrección (¿puede romper algo más?).
- Si la corrección cambia un contrato de API o un schema: invocar `architecture-reviewer`.

### 2. Implementador — Corrección
- Corrige estrictamente lo que el spec indica. No refactoriza código adyacente.
- Si durante la corrección descubre bugs adicionales: los documenta en `## Pendientes Abiertos` del spec y los reporta al orchestrator como nuevos ítems de backlog. No los corrige en la misma rama.
- Ejecuta todos los quality gates.

### 3. Revisores
- `anti-hallucination-reviewer`: siempre, verificando que la corrección no introduce referencias inventadas.
- `code-reviewer`: siempre, verificando que la corrección sigue los patrones del proyecto.
- `security-reviewer`: solo si el bug es de tipo auth, exposición de datos o manejo de tokens.

### 4. Orchestrator — Validación de DoD
- Evalúa el DoD completo según `.agents/protocols/dod-loop.md` (P-15). Si algún ítem falla, despacha la remediación al agente responsable; tope de 3 iteraciones antes de escalar al usuario.

### 5. PR Publisher — Apertura del PR
- Llena `.agents/templates/pr-template.md` con los datos ya producidos y ejecuta `gh pr create --base develop`. Si falta un dato, lo marca `FALTA: <dato>` en vez de inventarlo.

### 6. Tech Reviewer — Auditoría del PR abierto
- Compara claims del PR contra evidencia real y emite **APTO** o **CAMBIOS**. Si CAMBIOS, vuelve al loop de `dod-loop.md`.

### 7. Orchestrator — Integración
- Con `tech-reviewer` = APTO, integra el PR a `develop`.
- Invoca `docs-keeper` solo si el bugfix cambia documentación (un bugfix de comportamiento puro raramente cambia .claude/CLAUDE.md).

---

## Bugs críticos priorizados

Por P-14 (`.agents/protocols/global-rules.md`), el backlog es la única fuente de trabajo — la lista de bugs críticos diagnosticados vive en `docs/backlog.md`, no en este archivo. Para ítems con causa raíz y fix ya conocidos, el spec puede ser muy breve.

---

## Criterios de done del workflow completo

- PR mergeado a `develop`.
- Spec de bugfix en estado `DONE`.
- El comportamiento correcto verificado con prueba funcional.
- `docs/backlog.md` actualizado.
- El bug no se reproduce después de la integración.
