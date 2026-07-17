# ADR-1 — Política de selección de modelo por agente

**Fecha:** 2026-07-16
**Estado:** Aceptado
**Autores:** orchestrator (main loop)
**Revisores:** architecture-reviewer + orchestrator

---

## Contexto

El proyecto va a operar con un sistema de subagentes versionado: 11 roles ya diseñados en `.agents/roles/` materializados como subagentes de Claude Code, más 2 roles nuevos (`tech-reviewer`, `pr-publisher`), más 4 agentes de testing que ya existían como subagentes (`backend-tester`, `frontend-tester`, `test-planner`, `test-reviewer`).

Antes de este ADR no existía ninguna política de selección de modelo. Los 4 agentes ya materializados tenían `model:` con valores inválidos — `claude-sonnet-4-6` y `claude-opus-4-8` — que no corresponden a ningún ID real ni alias de la API de Anthropic. No había ningún criterio documentado para decidir cuándo usar Sonnet, Opus o Haiku en un agente nuevo.

## Decisiones consideradas

### Opción 1 — Todo en Sonnet sin excepciones

Todos los agentes usan `model: sonnet`, sin Haiku ni Opus en ningún caso.

**Ventajas:**
- Simplicidad total, cero riesgo de que un modelo insuficiente falle una tarea.
- Ninguna matriz que mantener ni criterio que aplicar mal.

**Desventajas:**
- Sobrepaga tareas 100% mecánicas (`docs-keeper`, `pr-publisher`) que no requieren razonamiento de Sonnet.
- No aprovecha razonamiento extra disponible en decisiones de alto riesgo (ADRs sin precedente, superficies de ataque nuevas).

### Opción 2 — Opus fijo en los roles "críticos"

`architecture-reviewer` y `security-reviewer` declaran `model: opus` en su frontmatter de forma permanente.

**Ventajas:**
- Más potencia de razonamiento disponible por defecto en los dos revisores de mayor impacto.

**Desventajas:**
- Contradice el criterio operativo ya definido por el usuario: "Opus nunca fijo".
- Encarece cada invocación de esos roles incluso cuando el caso es trivial (la mayoría de los checks de `security-reviewer`, por ejemplo, son una lista de verificación explícita ya documentada en el rol, no juicio abierto que requiera más razonamiento).
- No hay evidencia de que Opus sea más preciso que Sonnet para checks ya bien especificados.

### Opción 3 — Sonnet por defecto + Haiku mecánico + Opus como override puntual (elegida)

Todos los agentes declaran `model: sonnet` en su frontmatter. Excepción: `docs-keeper` y `pr-publisher` declaran `model: haiku` por ser tareas mecánicas de plantilla con salida verificable. Opus nunca aparece en ningún frontmatter — se aplica únicamente como override de despacho puntual, decidido por el orchestrator caso por caso y justificado en una línea.

**Ventajas:**
- Preserva el criterio de mínimo privilegio de cómputo (coherente con el principio *Least Privilege* de `/SSDLC.md`).
- Costo predecible: el roster completo corre en Sonnet salvo dos excepciones explícitas y documentadas.
- Deja la potencia extra de Opus disponible bajo demanda para los casos reales de ambigüedad, en vez de gastarla sistemáticamente en checks ya resueltos por checklist.
- Cada uso de Opus queda trazado en el reporte de despacho del subagente, auditable en revisión de PR.

**Desventajas:**
- Depende de que el orchestrator aplique el criterio correctamente caso por caso; un uso indiscriminado del override degradaría la política silenciosamente.

## Decisión

La opción elegida es: **Opción 3**.

Justificación: la Opción 1 desperdicia eficiencia en tareas puramente mecánicas y no deja margen para los casos de ambigüedad real que sí lo ameritan; la Opción 2 contradice un criterio operativo ya decidido y encarece de forma fija revisores cuyos checks son mayormente listas de verificación explícitas. La Opción 3 es la única que trata el modelo como un recurso a asignar según la naturaleza real de cada tarea, con trazabilidad de cada excepción.

## Consecuencias

**Positivas:**
- Costo de cómputo predecible y auditable.
- Trazabilidad de cada uso de Opus vía el reporte de despacho del subagente.
- `docs-keeper` y `pr-publisher` — los dos agentes de mayor volumen de invocación esperado (se ejecutan en cada pendiente cerrado) — corren en el modelo más barato sin pérdida de calidad, porque su tarea es transcripción verificable, no juicio.

**Negativas / riesgos asumidos:**
- Si el orchestrator abusa del override de Opus sin justificarlo, la política se degrada silenciosamente. Mitigado exigiendo la línea de justificación en el reporte del subagente, visible en revisión de PR.
- La matriz Haiku puede quedar corta si aparecen nuevos roles mecánicos — mitigado dejando el criterio de admisión explícito en `model-policy.md` §4 en vez de una lista cerrada.

**Deuda técnica generada:**
- Ninguna nueva; este ADR corrige la deuda existente de los 4 `model:` inválidos (`claude-sonnet-4-6`, `claude-opus-4-8`).

## Módulos afectados

- `.claude/agents/*.md` (17 archivos)
- `.claude/model-policy.md`
- `.claude/settings.json`

## Relación con otros ADRs

- Depende de: ninguno (es el ADR-1 del proyecto).
- Reemplaza a: ninguno.
- Relacionado con: ninguno todavía.

---

*ADR creado por `architecture-reviewer`. Aprobado por `orchestrator`.*
