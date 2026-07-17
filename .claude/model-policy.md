# Política de Selección de Modelo — Harness de Agentes

**Alcance:** todos los agentes en `.claude/agents/`, el main loop (Fable), y el uso consultivo de Codex.
**Referencia:** `.agents/orchestrator.md`, `docs/adrs/ADR-1-politica-de-modelos.md`
**Regla rectora:** el default es Sonnet. Cualquier desviación (Haiku u Opus) requiere justificación explícita en este documento o en el despacho puntual.

---

## 1. El main loop (Fable) solo orquesta

El main loop de Claude Code en este proyecto se comporta como `.agents/orchestrator.md` describe: selecciona pendientes, provee contexto completo a subagentes, valida entregables, controla integración. **No implementa código, no escribe specs, no ejecuta quality gates directamente.** Ver la tabla "Límites de responsabilidad" en `.agents/orchestrator.md`.

Sin un spec en estado `IN PROGRESS` commiteado (P-01, `.agents/protocols/global-rules.md`), ningún trabajo de implementación se ejecuta — esto ya lo impone el modo plan de Claude Code y P-01; esta política no lo repite, lo hereda.

## 2. Modelo por defecto: Sonnet

Todo agente en `.claude/agents/*.md` declara `model: sonnet` explícitamente en el frontmatter. Ningún agente queda sin el campo `model:`.

## 3. Opus — nunca fijo, solo override puntual de despacho

Ningún archivo en `.claude/agents/` puede tener `model: opus` hardcodeado. Opus se usa exclusivamente como *override* pasado por el orchestrator al despachar una tarea puntual (vía el mecanismo de invocación de subagente), cuando hay ambigüedad real de arquitectura o de interpretación de requerimiento que Sonnet no resuelve con confianza.

Cuándo el orchestrator puede aplicar el override (ejemplos, no exhaustivo):
- `architecture-reviewer` evaluando un ADR con múltiples tradeoffs no triviales y sin precedente en ADRs existentes.
- `security-reviewer` ante una superficie de ataque nueva no cubierta por los checks ya documentados en su rol.
- `spec-writer` redactando la historia SMART de un pendiente con requerimiento ambiguo del usuario.

El override se declara en una línea al invocar, ej.: `Despachar architecture-reviewer con model: opus — el ADR compara 3 estrategias de particionado de datos sin precedente en docs/adrs/, requiere razonamiento profundo.` Esta línea queda en el reporte de salida del subagente para trazabilidad.

## 4. Haiku — "transcribe, no decide"

Haiku se reserva para tareas 100% mecánicas: instrucción tipo plantilla, entrada estructurada, salida verificable contra una regla fija, sin juicio de diseño. Matriz de este repo:

| Agente | Haiku? | Por qué |
|---|---|---|
| `docs-keeper` | Sí | Tabla fija "si cambió X → actualizar sección Y de CLAUDE.md", verificado contra el código real. Sin juicio de diseño. |
| `pr-publisher` | Sí | Llena `.agents/templates/pr-template.md` con datos ya producidos por otros agentes. Checkbox sin marcar o `FALTA: <dato>` si algo falta. No redacta, no decide. |
| Todos los demás (15 agentes) | No | Requieren juicio: interpretar un spec, evaluar seguridad, revisar arquitectura, escribir código, diseñar casos de prueba, auditar veredictos. Default: Sonnet. |

Si en el futuro se detecta otro candidato legítimo, debe cumplir las dos condiciones a la vez: (1) entrada + plantilla + regla de salida ya están 100% definidas en el rol, (2) el resultado es mecánicamente verificable sin criterio humano adicional. Si hay duda, el default es Sonnet.

## 5. Codex — segunda opinión consultiva, nunca gate

Codex (plugin `codex@openai-codex`, marketplace `openai/codex-plugin-cc`) se invoca **después** de que el PR está abierto, en paralelo con `tech-reviewer`. Su output es un comentario/observación, nunca un veredicto bloqueante. Se declara a nivel proyecto en `.claude/settings.json` (ver §6). El ítem correspondiente en `.agents/checklists/pr-checklist.md` es explícitamente no bloqueante.

**Nota operativa:** el bloque de plugin en `.claude/settings.json` no se pudo verificar en el momento de escribir esta política. Debe confirmarse manualmente después de mergear el PR de esta tarea, ejecutando `claude` en el repo y verificando que el plugin aparece habilitado.

## 6. `.claude/settings.json` (declaración del plugin)

Archivo versionado (distinto de `.claude/settings.local.json`, que permanece local e ignorado por git) que declara `extraKnownMarketplaces` y `enabledPlugins` para Codex. Ver contenido en `.claude/settings.json`.

## 7. Verificación de cumplimiento de esta política

Como no hay lint configurado en el repo, el cumplimiento se verifica manualmente (o vía `tech-reviewer`) con:
```bash
grep -L "^model:" .claude/agents/*.md          # debe devolver vacío (nada sin model:)
grep -rn "model: opus" .claude/agents/*.md     # debe devolver vacío (nada hardcodeado en opus)
```
Este check es un ítem verificable en `.agents/protocols/dod-loop.md` (P-15) y en `.agents/checklists/pr-checklist.md`.
