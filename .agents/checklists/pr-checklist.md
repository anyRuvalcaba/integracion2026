# Checklist — Pull Request

> Usado por el `orchestrator` antes de preparar y aprobar un PR hacia `develop`.

---

## Antes de preparar el PR

- [ ] El spec del pendiente está en estado `DONE`
- [ ] `## Resultados` está completo (fecha de cierre, CAs cumplidos/no, deuda, lecciones)
- [ ] `## Pendientes Abiertos y Gaps Detectados` está completo (cada campo con valor o "ninguno")
- [ ] `## Matriz de cierre` está completa
- [ ] No hay ítems `Parcial` o `Inconsistente` en la Matriz de cierre sin referencia de backlog
- [ ] `anti-hallucination-reviewer` reportó APROBADO
- [ ] `code-reviewer` reportó APROBADO
- [ ] `security-reviewer` reportó APROBADO o CONDICIONADO (si aplica al cambio)
- [ ] `architecture-reviewer` reportó APROBADO o ADR creado (si aplica al cambio)

## Verificación del diff

- [ ] El diff contiene solo cambios del pendiente en cuestión (no hay cambios de otros ítems)
- [ ] No hay `debugger` en ningún archivo del diff
- [ ] No hay `console.log` en ningún archivo del diff
- [ ] No hay secrets ni tokens en el diff
- [ ] No hay archivos `.env` ni `.env.local` en el diff
- [ ] Los archivos en el diff son los esperados según el spec

## Verificación del PR

- [ ] El título del PR describe el cambio en menos de 70 caracteres
- [ ] El body del PR usa la plantilla `.agents/templates/pr-template.md`
- [ ] El spec está referenciado en el body del PR
- [ ] El ítem de backlog está referenciado con su ID
- [ ] Los CAs están listados con su estado (cumplido / no cumplido)
- [ ] Los quality gates están marcados en el checklist del PR

## Después de abierto el PR (antes de mergear)

- [ ] `tech-reviewer` reportó veredicto **APTO** (bloqueante)
- [ ] Codex — segunda opinión consultiva revisada (no bloqueante, no impide merge)

## Después del merge

- [ ] `docs-keeper` fue invocado para actualizar `.claude/CLAUDE.md` si hubo cambios en modelos, rutas o estructura
- [ ] `docs/backlog.md` tiene el ítem marcado como integrado
- [ ] La rama del pendiente fue borrada después del merge
- [ ] No hay ramas activas del mismo pendiente sin mergear
