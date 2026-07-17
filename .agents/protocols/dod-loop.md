# P-15 — Loop de cierre de Definition of Done

**Referencia:** SSDLC v2.0.0 FASE 7-8, `.agents/checklists/backend-dod.md`, `frontend-dod.md`, `pr-checklist.md`
**Ejecutor:** orchestrator

---

## Propósito

Define cómo el orchestrator reacciona ante un DoD incumplido: qué agente remedia cada tipo de fallo, y cuándo detener el loop y escalar al usuario en vez de seguir reintentando.

## Mecanismo

Al final de cada ciclo de implementación, el orchestrator evalúa el DoD (`backend-dod.md` / `frontend-dod.md` / `pr-checklist.md` según corresponda) ítem por ítem. Por cada ítem incumplido, despacha al agente responsable según la tabla siguiente. Esto cuenta como **una iteración**.

## Tabla de remediación

| Fallo detectado | Agente responsable de remediar |
|---|---|
| Tests backend en rojo (`npm test` en `ecommerce-api`) | `backend-builder` |
| Tests frontend en rojo (`npm test -- --watchAll=false`, o `npm run test:run` si ese script ya existe en la rama) | `frontend-builder` |
| Cypress E2E en rojo (login/register/checkout) — solo si Cypress ya está configurado en la rama | `frontend-builder` si el fallo es de UI/estado; `backend-builder` si el fallo es de contrato de API — el orchestrator decide leyendo el mensaje de fallo antes de despachar |
| `anti-hallucination-reviewer` → BLOQUEADO | El implementador que generó el hallazgo (`backend-builder` o `frontend-builder`) |
| `code-reviewer` → BLOQUEADO | El implementador que generó el hallazgo |
| `security-reviewer` → BLOQUEADO | El implementador; si el hallazgo implica cambio de contrato/schema, primero `architecture-reviewer` (ADR) y luego el implementador |
| `architecture-reviewer` → BLOQUEADO / ADR pendiente | `architecture-reviewer` crea el ADR; luego el implementador ajusta según la decisión documentada |
| Spec sin `## Resultados` / `## Matriz de cierre` completos | El implementador que cerró el pendiente |
| `CLAUDE.md` o `docs/backlog.md` desactualizado | `docs-keeper` |
| PR template con algún `FALTA: <dato>` | El orchestrator resuelve el dato faltante (consultando al implementador o al spec) y reintenta `pr-publisher` |
| `tech-reviewer` (post-PR) → veredicto CAMBIOS | El implementador correspondiente al hallazgo señalado en el reporte |
| `model:` faltante o `opus` hardcodeado en algún `.claude/agents/*.md` | El agente/persona que introdujo el archivo — corrige el frontmatter según `.claude/model-policy.md` |

## Tope de iteraciones

- Máximo **3 iteraciones** completas del loop por pendiente.
- Cada iteración = un ciclo despacho → remediación → re-evaluación del DoD completo.
- Si tras 3 iteraciones el DoD sigue incumplido: el orchestrator **detiene el loop** y escala al usuario con el formato de `SSDLC.md` §Reglas de escalamiento (la duda/hallazgo, al menos dos opciones viables, impacto, recomendación).
- El orchestrator no reintenta indefinidamente ni redefine el alcance del pendiente para "hacerlo pasar".

## Relación con P-01 a P-14

Este protocolo no reemplaza P-07 (orden de revisores) ni P-03 (el implementador no se autoaprueba); opera después de que un revisor emite BLOQUEADO, decidiendo a quién se le devuelve el trabajo y cuándo dejar de intentar.
