# Spec: Harness de modelos y agentes versionado en el repo

## Metadata
- **Tipo:** infra
- **Complejidad:** L
- **Fecha:** 2026-07-16
- **Estado:** DONE

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

- [x] CA-1: `.claude/model-policy.md` documenta que el main loop solo orquesta (`.agents/orchestrator.md`), `model: sonnet` es el default explícito en todo agente, Opus nunca queda fijo en frontmatter (solo override puntual de despacho justificado en una línea), y la matriz Haiku SÍ/NO (solo `docs-keeper` y `pr-publisher`).
- [x] CA-2: `docs/adrs/ADR-1-politica-de-modelos.md` existe, sigue `.agents/templates/adr-template.md`, y documenta las 3 opciones consideradas y la justificación de la elegida.
- [x] CA-3: Los 17 agentes en `.claude/agents/` (11 roles materializados + `tech-reviewer` + `pr-publisher` nuevos + 4 agentes de test con `model:` corregido) tienen frontmatter válido de Claude Code, con `model:` explícito y sin ningún `opus` hardcodeado. Verificado: `grep -L "^model:" .claude/agents/*.md` y `grep -rn "model: opus" .claude/agents/*.md` ambos vacíos; `ls .claude/agents/*.md | wc -l` = 17.
- [x] CA-4: `.agents/protocols/dod-loop.md` (P-15) define el mapa ítem de fallo → agente responsable de remediar, con tope de 3 iteraciones y escalamiento al usuario si se supera. Referenciado desde `global-rules.md`, `feature-flow.md` y `bugfix-flow.md`.
- [ ] CA-5: El trabajo se entrega en rama `infra/model-agent-harness` (desde `develop`) con PR contra `develop`, usando `.agents/templates/pr-template.md`, y `tech-reviewer` audita el PR ya abierto como prueba viva del loop. **Parcial:** la rama existe y todos los commits están hechos; el push y la apertura del PR real quedan pendientes de que el usuario confirme `git remote` y `gh` CLI configurados (bloqueo externo, ver Pendientes Abiertos).

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

- **Funcionalidades faltantes:** ninguna respecto al alcance acordado con el usuario.
- **Comportamientos inconsistentes detectados:** durante la ejecución de `npm test` en `ecommerce-api` se detectó 1 test (`IT-CART-014`) fallando de 180; no está relacionado con este trabajo (no se tocó código de aplicación) y ya fallaba antes de esta rama. No se investigó a fondo por estar fuera de alcance — se registra como hallazgo, no se corrige aquí.
- **Gaps entre frontend y backend:** no aplica (este trabajo no toca código de aplicación).
- **Persistencia pendiente de migrar:** no aplica.
- **Decisiones aplazadas:** activar formalmente FASE 10.5 (baseline oficial) queda para cuando el backlog esté formalizado y priorizado en su totalidad; verificación manual de que el plugin Codex carga correctamente queda pendiente post-merge.
- **Trabajo fuera de alcance en esta iteración:** la "estrategia integral de pruebas" (16 fases) pedida en paralelo por el usuario queda explícitamente fuera — se abordará en una sesión nueva. El test `IT-CART-014` fallando no se investiga ni corrige aquí.
- **Riesgos que requieren seguimiento:** confirmar que el plugin Codex realmente carga tras el merge; confirmar que el push/PR real se completa una vez el usuario tenga remote+gh listos.
- **Items que deben convertirse en backlog:** `INFRA-002` (activar FASE 10.5 cuando el backlog esté formalizado), `INFRA-003` (verificar carga del plugin Codex post-merge), `INFRA-004` (completar push + apertura de PR real una vez configurado remote/gh), `INFRA-005` (investigar el test `IT-CART-014` fallando en `ecommerce-api`, preexistente y no relacionado con este trabajo).

## Resultados (se completa al cerrar)
- **Fecha de cierre:** 2026-07-16
- **CAs cumplidos:** CA-1, CA-2, CA-3, CA-4
- **CAs no cumplidos:** CA-5 parcial — rama y commits completos; push/PR real bloqueados por infraestructura externa (sin `git remote` ni `gh` CLI al momento del cierre de este spec).
- **Deuda técnica generada:** ninguna nueva sobre el harness; se documenta el hallazgo preexistente `IT-CART-014` como ítem de backlog separado.
- **Lecciones aprendidas:** auditar `.gitignore` antes de diseñar cualquier política de agentes es un paso obligatorio — el hallazgo de que `.agents/` y `.claude/` estaban completamente ignorados cambió por completo el diagnóstico y el alcance real del trabajo.
- **Pendientes abiertos confirmados:** ver sección anterior.
- **Gaps no resueltos:** apertura de PR real contra `develop` (bloqueada por infraestructura externa al alcance de este spec).
- **Trabajo fuera de alcance confirmado:** estrategia integral de pruebas (16 fases), FASE 10.5 / baseline oficial, investigación de `IT-CART-014`.
- **Backlog derivado creado:** sí — `INFRA-002`, `INFRA-003`, `INFRA-004`, `INFRA-005` agregados a `docs/backlog.md` en este mismo commit de cierre.
- **Referencias a historias/tareas creadas:** `INFRA-001` (este spec, DONE), `INFRA-002`, `INFRA-003`, `INFRA-004`, `INFRA-005` (ver `docs/backlog.md`).

## Matriz de cierre

| Ítem detectado | Estado | Acción |
|---|---|---|
| Política de modelos + ADR-1 | Confirmado | Cerrar |
| 17 agentes materializados con `model:` válido (verificado por grep) | Confirmado | Cerrar |
| `dod-loop.md` (P-15) + referencias en workflows y global-rules | Confirmado | Cerrar |
| `.gitignore` corregido, `.agents/`+`.claude/` versionados | Confirmado | Cerrar |
| CLAUDE.md, settings.json, PR template, pr-checklist actualizados | Confirmado | Cerrar |
| Push + PR real contra `develop` | Parcial | Backlog `INFRA-004` |
| Verificación del plugin Codex | Parcial | Backlog `INFRA-003` |
| FASE 10.5 / baseline oficial | Fuera de alcance | Backlog `INFRA-002` |
| Test `IT-CART-014` fallando (preexistente) | Inconsistente | Backlog `INFRA-005` |
| Estrategia integral de pruebas (16 fases) | Fuera de alcance | Sesión nueva, ya acordado con el usuario |
