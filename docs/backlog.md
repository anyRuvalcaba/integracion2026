# Backlog

> Única fuente de trabajo válida (P-14, `.agents/protocols/global-rules.md`). Ningún pendiente se trabaja sin estar registrado aquí.

| ID | Tipo | Descripción | Prioridad | Estado |
|---|---|---|---|---|
| INFRA-001 | infra | Harness de modelos y agentes versionado (`.claude/model-policy.md`, materialización de 17 agentes, `dod-loop.md`, ADR-1) | Alta | DONE |
| INFRA-002 | infra | Activar FASE 10.5 (baseline oficial, tag `baseline/v1.0`) cuando el backlog esté formalizado y priorizado en su totalidad | Media | Pendiente |
| INFRA-003 | infra | Verificar manualmente que el plugin `codex@openai-codex` declarado en `.claude/settings.json` carga correctamente | Media | Pendiente |
| INFRA-004 | infra | Abrir el PR real de `infra/model-agent-harness` contra `develop` (push ya completado 2026-07-16; falta invocar `pr-publisher` y `tech-reviewer`) | Alta | En progreso |
| INFRA-005 | bugfix | Investigar y corregir el test `IT-CART-014` (`ecommerce-api/src/__tests__/integration/cart.test.js`) — falla preexistente, no relacionada con INFRA-001 | Media | Pendiente |
