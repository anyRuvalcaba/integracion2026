# PR Template

> Copiar este contenido como body del PR. Reemplazar los valores entre corchetes.

---

## Descripción

[Qué se hizo y por qué, en 2-3 oraciones. Enfocarse en el valor funcional o técnico, no en los detalles de implementación.]

## Spec relacionado

`docs/specs/[YYYY-MM-DD]-[tipo]-[nombre-corto].md`

## Ítem de backlog

`[ID]` — [descripción corta del ítem]

## Tipo de cambio

- [ ] Feature
- [ ] Bugfix
- [ ] Refactor
- [ ] Security patch
- [ ] Documentación
- [ ] Infra

## Criterios de aceptación

- [x] CA-1: [descripción]
- [x] CA-2: [descripción]
- [ ] CA-3: [descripción — si no cumplido, explicar por qué]

## Quality Gates

- [x] Type check / lint — sin errores
- [x] Tests — todos pasan
- [x] Diff revisado — sin secrets, sin `debugger`, sin `console.log`
- [x] Prueba funcional — todos los CAs verificados
- [x] anti-hallucination-reviewer — APROBADO
- [x] code-reviewer — APROBADO
- [ ] security-reviewer — APROBADO (solo si aplica)

## Consideraciones de seguridad

[Amenazas STRIDE evaluadas y controles aplicados. Si no hay cambios de seguridad relevantes, escribir "No aplica".]

## Impacto en documentación

- [ ] CLAUDE.md actualizado
- [ ] backlog.md actualizado
- [ ] ADR creado: `docs/adrs/ADR-[N]-[nombre].md`
- No aplica (sin cambios en modelos, rutas ni estructura)

## Breaking changes

[Ninguno | Descripción del breaking change y módulos afectados]

## Screenshots (solo para cambios de UI)

[Adjuntar captura antes/después si el cambio es visual]

---

*PR preparado por `orchestrator`. Agente implementador: `[nombre]`.*
