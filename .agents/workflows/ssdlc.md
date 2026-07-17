# SSDLC — Referencia del Workflow Base

> El protocolo SSDLC completo vive en `/SSDLC.md` (raíz del workspace).
> Este archivo es un índice de referencia rápida para los subagentes.

---

## Secuencia de fases (v2.0.0)

| # | Fase | Agente(s) principal(es) |
|---|------|------------------------|
| 0 | Lectura de contexto | orchestrator |
| 1 | Clasificación y STRIDE | orchestrator + security-reviewer |
| 2 | Historia SMART | spec-writer |
| 3 | Spec Driven Design | spec-writer + architecture-reviewer |
| 4 | Gestión de rama | implementador (backend/frontend-builder) |
| 5 | Skill Audit | orchestrator |
| 6 | Implementación segura | backend-builder / frontend-builder |
| 7 | Verificación y quality gates | code-reviewer + anti-hallucination-reviewer |
| 8 | Prueba funcional | implementador + qa-test-designer |
| 9 | Pull Request | orchestrator |
| 10 | Cierre documental | docs-keeper + orchestrator |
| 10.5 | Baseline oficial | orchestrator + docs-keeper (una sola vez) |

---

## Modo subagente

Activo tras el baseline (`baseline/v1.0` en Git).

Ver documento completo: `/SSDLC.md` §MODO DE EJECUCIÓN CON SUBAGENTES

---

## Restricciones no negociables (resumen)

1. Ningún subagente trabaja fuera del backlog aprobado.
2. 1 pendiente = 1 spec = 1 rama = 1 PR.
3. Ningún subagente integra hacia `develop` de forma autónoma.
4. Ningún subagente puede autoaprobarse.
5. El spec debe estar `DONE` antes de integrar.

Ver lista completa: `/SSDLC.md` §Restricciones no negociables
