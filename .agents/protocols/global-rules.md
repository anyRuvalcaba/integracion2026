# Protocolos Obligatorios — Sistema de Subagentes

**Versión:** 1.0.0
**Referencia:** SSDLC v2.0.0

---

## Protocolos de implementación

### P-01 — Ningún agente implementa sin spec aprobado
Todo trabajo de implementación requiere un spec en estado `IN PROGRESS` commiteado en `develop`. Si el spec no existe, se para el trabajo y se invoca `spec-writer`.

### P-02 — Ningún agente cierra tarea sin evidencia
Un pendiente no se considera cerrado sin:
- Resultado de quality gates (output de `npm test` o equivalente).
- Prueba funcional de al menos un CA.
- Spec en estado `DONE` con todos los campos completos.

### P-03 — El implementador no puede autoaprobarse
El agente que implementó el pendiente no puede ejecutar `code-reviewer` ni `anti-hallucination-reviewer` sobre su propio trabajo. Estos revisores son siempre ejecutados por el orchestrator o por un agente diferente.

### P-04 — Cambio de arquitectura requiere ADR
Cualquier cambio que afecte: un schema Mongoose, el contrato de una API existente, el manejo de estado del frontend, o la introducción de una nueva librería — requiere que `architecture-reviewer` cree un ADR antes de que comience la implementación.

### P-05 — Cada cambio debe actualizar spec/tests/docs
- Si el cambio modifica un modelo: `docs-keeper` actualiza `.claude/CLAUDE.md` §modelos.
- Si el cambio agrega o modifica una ruta: `docs-keeper` actualiza `.claude/CLAUDE.md` §mapa-de-rutas.
- Si el cambio introduce nueva funcionalidad: `qa-test-designer` produce el plan de pruebas.
- Si el cambio es un bugfix: el qa-test-designer revisa si el bug tenía cobertura de test (si no la tenía, se agrega).

---

## Protocolos de integración

### P-06 — La integración es exclusiva del orchestrator
Ningún subagente hace merge hacia `develop`. El orchestrator valida todos los reportes de revisores antes de preparar el PR.

### P-07 — Orden de revisores antes de integrar
1. `anti-hallucination-reviewer` (siempre)
2. `code-reviewer` (siempre)
3. `security-reviewer` (si hay cambio en auth, modelos o datos sensibles)
4. `architecture-reviewer` (si hay cambio arquitectónico)

Cualquier revisor puede bloquear la integración.

### P-08 — Una rama por pendiente
La rama debe contener solo los cambios del pendiente asignado. Si durante la implementación el agente descubre que necesita modificar algo fuera del alcance, lo documenta como nuevo ítem de backlog y lo reporta. No lo implementa en la misma rama.

### P-09 — Ningún agente toca main, master o develop directamente
Todo trabajo en ramas. Los merges a `develop` los hace el orchestrator a través de PRs.

### P-15 — Loop de cierre de Definition of Done
Al final de cada ciclo, el orchestrator evalúa el DoD ítem por ítem y despacha la remediación al agente responsable según la tabla de `.agents/protocols/dod-loop.md`. Tope de 3 iteraciones por pendiente; al superarlo, se detiene el loop y se escala al usuario. Ver el documento completo para la tabla de remediación y el formato de escalamiento.

---

## Protocolos de escalamiento

### P-10 — Las ambigüedades se escalan, no se resuelven inventando
Si un subagente encuentra una ambigüedad no cubierta por el contexto de entrada, detiene el trabajo y escala al orchestrator con: la duda, opciones viables, impacto de cada opción y su recomendación.

### P-11 — Solo el orchestrator decide si escalar al usuario
Los subagentes no interrumpen al usuario directamente. El orchestrator decide si la ambigüedad requiere consulta humana o puede resolverse con información del baseline.

---

## Protocolos de documentación

### P-12 — Documentar lo que existe, no lo que se planea
`.claude/CLAUDE.md` y los specs documentan el estado real del código. No se documenta funcionalidad no implementada como si existiera.

### P-13 — Los prompts sin consumir se archivan
Los archivos de prompt que sirvieron para invocar a la IA pero no son documentación del sistema se mueven a `.archive/`. No viven mezclados con documentación real.

### P-14 — El backlog es la única fuente de trabajo
Ningún pendiente se trabaja sin estar registrado en `docs/backlog.md`. Los hallazgos durante la implementación se registran como nuevos ítems de backlog, no se ejecutan de inmediato.
