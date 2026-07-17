# Spec: Harness de modelos y agentes versionado en el repo

## Metadata
- **Tipo:** infra
- **Complejidad:** L
- **Fecha:** 2026-07-16
- **Estado:** IN PROGRESS

## Historia

Como equipo que clona este repo, necesitamos que el harness de modelos y agentes de Claude Code (política de selección de modelo, roster de subagentes, protocolo SSDLC, templates y checklists) viva versionado en el repositorio — no solo en la máquina de un integrante — para que cualquiera que clone tenga el mismo contexto operativo desde el primer `git clone`.

- **Específica:** corregir `.gitignore` para versionar `.agents/` y `.claude/`, definir una política explícita de selección de modelo por agente, materializar el roster completo de subagentes con `model:` válido, y cerrar el loop de Definition of Done con un mapa de remediación ítem→agente.
- **Medible:** los 17 agentes en `.claude/agents/` tienen `model:` válido (ninguno vacío, ninguno `opus` hardcodeado); `.claude/model-policy.md`, el ADR, y `.agents/protocols/dod-loop.md` existen y son consistentes entre sí; el PR de esta tarea sirve como prueba viva del loop (tech-reviewer audita el propio PR).
- **Alcanzable:** se reutiliza el trabajo de diseño ya existente en `.agents/roles/*.md` (11 roles completos) en vez de diseñar un set de agentes desde cero; solo se diseñan de cero `tech-reviewer` y `pr-publisher`, que genuinamente no existían.
- **Relevante:** sin esto, cada integrante del equipo (y cada sesión nueva de Claude Code) opera con reglas distintas o inexistentes, y el sistema SSDLC ya diseñado nunca se activa realmente porque nadie más que este usuario puede verlo.
- **Temporal:** complejidad L — toca ~25 archivos entre nuevos y modificados, pero sin cambios en código de aplicación.

## Contexto

El repo ya tenía un protocolo SSDLC completo (`/SSDLC.md` v2.0.0) y un sistema de 11 roles de agente bien diseñados en `.agents/roles/`, más 4 subagentes ya materializados en `.claude/agents/`. Sin embargo, `.gitignore` contenía `.agents/` y `.claude/` completos, por lo que nada de esto se había commiteado nunca — vivía solo en disco local. Además, los 4 agentes materializados tenían `model:` con IDs inventados (`claude-sonnet-4-6`, `claude-opus-4-8`) que no existen en la API de Anthropic. El usuario pidió formalizar una política de modelos, completar el roster de agentes con dos roles nuevos (`tech-reviewer`, `pr-publisher`), y cerrar el loop de Definition of Done — todo versionado y entregado vía PR.

## Criterios de Aceptación

- [ ] CA-1: `.claude/model-policy.md` documenta que el main loop solo orquesta (`.agents/orchestrator.md`), `model: sonnet` es el default explícito en todo agente, Opus nunca queda fijo en frontmatter (solo override puntual de despacho justificado en una línea), y la matriz Haiku SÍ/NO (solo `docs-keeper` y `pr-publisher`).
- [ ] CA-2: `docs/adrs/ADR-1-politica-de-modelos.md` existe, sigue `.agents/templates/adr-template.md`, y documenta las 3 opciones consideradas y la justificación de la elegida.
- [ ] CA-3: Los 17 agentes en `.claude/agents/` (11 roles materializados + `tech-reviewer` + `pr-publisher` nuevos + 4 agentes de test con `model:` corregido) tienen frontmatter válido de Claude Code, con `model:` explícito y sin ningún `opus` hardcodeado.
- [ ] CA-4: `.agents/protocols/dod-loop.md` (P-15) define el mapa ítem de fallo → agente responsable de remediar, con tope de 3 iteraciones y escalamiento al usuario si se supera.
- [ ] CA-5: El trabajo se entrega en rama `infra/model-agent-harness` (desde `develop`) con PR contra `develop`, usando `.agents/templates/pr-template.md`, y `tech-reviewer` audita el PR ya abierto como prueba viva del loop. *(pendiente: requiere que el usuario confirme remote + `gh` CLI configurados antes de push/PR)*

## Consideraciones de Seguridad

- **Amenazas STRIDE identificadas:** ninguna aplica en sentido estricto — este cambio es documentación y configuración de harness, no toca autenticación, datos de usuario, ni superficie de red. El único vector remotamente relevante es *Tampering* sobre el propio harness (un agente mal configurado podría auto-aprobarse o saltarse el DoD) — mitigado por P-03 (el implementador no se autoaprueba) y P-15 (tope de iteraciones + escalamiento).
- **Controles de mitigación:** ningún agente materializado tiene permisos de merge autónomo (P-06, P-09); `pr-publisher` solo puede abrir PRs, no mergearlos; `tech-reviewer` es read-only.
- **Inputs que requieren validación:** no aplica (sin inputs de usuario final).
- **Secrets involucrados:** ninguno. El plugin Codex se declara en `.claude/settings.json` sin credenciales (la autenticación del plugin, si la requiere, es responsabilidad de cada integrante vía su propia sesión de Claude Code).
- **Superficie de ataque afectada:** ninguna en producción — cambios exclusivamente en `.claude/`, `.agents/`, `docs/`, `.github/`, `.gitignore`.

## Dependencias

- **Internas:** reutiliza el contenido ya escrito de `.agents/roles/*.md`, `.agents/templates/pr-template.md`, `.agents/checklists/*.md`, y la estructura de `.claude/agents/*.md` ya existente.
- **Externas:** plugin `codex@openai-codex` (marketplace `openai/codex-plugin-cc`) — no verificable en esta sesión, requiere confirmación manual post-merge. `gh` CLI y un `git remote` configurado — no existían al iniciar esta tarea; el usuario los configura antes del paso de push/PR.

## Decisiones de Diseño

1. **Materializar los 11 roles existentes en vez de diseñar un set nuevo** — ya están bien escritos, son propios de este proyecto (no copiados de otro repo), y cubren de sobra el mínimo pedido (implementador = backend-builder + frontend-builder; QA = qa-test-designer + backend-tester/frontend-tester + test-reviewer; revisor pre-PR = code-reviewer + security-reviewer + anti-hallucination-reviewer + architecture-reviewer).
2. **`tech-reviewer` y `pr-publisher` como roles nuevos** — genuinamente no existían; se documentan primero en `.agents/roles/` (mismo formato que los demás) y luego se materializan.
3. **Crear `develop` ahora y apuntar todo el flujo ahí** — decisión explícita del usuario tras señalar que `/SSDLC.md` exige GitFlow pero el repo solo tenía `main`.
4. **`docs/backlog.md` con fila bootstrap `INFRA-001`** — decisión explícita del usuario para no dejar una contradicción con P-14 desde el primer commit.
5. **Matriz Haiku restringida a 2 agentes** (`docs-keeper`, `pr-publisher`) — criterio conservador: solo tareas 100% mecánicas con plantilla fija y salida verificable contra el código real; todo lo demás requiere juicio y queda en `sonnet`.

## Riesgos y Deuda Técnica

- El bloque de plugin Codex en `.claude/settings.json` no pudo verificarse en esta sesión (sin acceso a instalar/probar plugins de marketplace).
- FASE 10.5 de `/SSDLC.md` ("Baseline oficial", tag `baseline/v1.0`) queda explícitamente fuera de alcance — requiere que el backlog esté "formalizado, priorizado y aprobado" en su totalidad, y hoy solo tiene el ítem bootstrap.
- El PR de esta tarea depende de que el usuario configure `git remote` y `gh` CLI, que no existían al iniciar el trabajo.

## Pendientes Abiertos y Gaps Detectados

> Esta sección se completa durante la implementación y se confirma al cerrar.

- **Funcionalidades faltantes:** por confirmar al cierre.
- **Comportamientos inconsistentes detectados:** por confirmar al cierre.
- **Gaps entre frontend y backend:** no aplica (este trabajo no toca código de aplicación).
- **Persistencia pendiente de migrar:** no aplica.
- **Decisiones aplazadas:** activar formalmente FASE 10.5 (baseline oficial) queda para cuando el backlog esté completo; verificación manual del plugin Codex queda pendiente post-merge.
- **Trabajo fuera de alcance en esta iteración:** la "estrategia integral de pruebas" (16 fases) pedida en paralelo por el usuario queda explícitamente fuera — se abordará en una sesión nueva.
- **Riesgos que requieren seguimiento:** operativo — confirmar que el plugin Codex realmente carga tras el merge.
- **Items que deben convertirse en backlog:** por confirmar al cierre.

## Resultados (se completa al cerrar)
- **Fecha de cierre:**
- **CAs cumplidos:**
- **CAs no cumplidos:**
- **Deuda técnica generada:**
- **Lecciones aprendidas:**
- **Pendientes abiertos confirmados:**
- **Gaps no resueltos:**
- **Trabajo fuera de alcance confirmado:**
- **Backlog derivado creado:**
- **Referencias a historias/tareas creadas:**

## Matriz de cierre

| Ítem detectado | Estado | Acción |
|---|---|---|
