Actúa como un Arquitecto Senior de AI Workflows, SSDLC, Spec Driven Design y Vibe Coding.

Tu tarea es diseñar y crear una capa de subagentes para mi proyecto ecommerce, respetando el workflow existente en `.agents/workflows/ssdlc.md`.

## Contexto del proyecto
- Es un proyecto ecommerce MERN.
- El enfoque actual es Vibe Coding, pero con disciplina técnica.
- Ya existe un workflow SSDLC.
- Ya trabajamos con Spec Driven Design.
- Ya existen specs y planes de prueba.
- Queremos agregar roles de subagentes, plantillas, workflows complementarios y reglas operativas.
- El objetivo NO es reemplazar el SSDLC actual, sino extenderlo con una arquitectura de subagentes clara, útil y escalable para un equipo.

## Workflow existente que debes respetar
Debes conservar esta lógica base del flujo actual:
1. Lectura de contexto
2. Clasificación y STRIDE
3. Historia SMART
4. Spec Driven Design
5. Gestión de rama
6. Skill Audit
7. Implementación segura
8. Verificación y quality gates
9. Prueba funcional
10. Pull Request
11. Cierre de spec

No cambies esta secuencia principal.
Tu trabajo es proponer qué subagentes participan en cada etapa, qué artefactos producen y cómo se coordinan.

## Objetivo
Necesito que diseñes una estructura profesional de subagentes para este proyecto, enfocada en:
- mejorar claridad de responsabilidades
- reducir improvisación
- evitar alucinaciones de IA
- mejorar calidad del código
- reforzar seguridad y pruebas
- dejar memoria documental del proyecto
- servir como marco pedagógico para alumnos que usan IA para desarrollar

## Lo que debes entregar

### 1. Arquitectura general de subagentes
Define una propuesta de roles de subagentes recomendados para este proyecto.

Como mínimo evalúa y propone cuáles de estos deben existir:
- orchestrator
- spec-writer
- architecture-reviewer
- frontend-builder
- backend-builder
- qa-test-designer
- security-reviewer
- docs-keeper
- code-reviewer
- release-observability
- prompt-critic
- anti-hallucination-reviewer
- learning-coach

Para cada subagente quiero:
- nombre del archivo `.md`
- propósito
- cuándo se invoca
- entradas esperadas
- salidas esperadas
- reglas que debe seguir
- límites de su responsabilidad
- criterios de “done”

### 2. Mapa de intervención por fases
Cruza los subagentes contra las fases del SSDLC actual.
Quiero una tabla donde indiques:
- fase
- objetivo de la fase
- subagentes que intervienen
- entregable mínimo por fase
- riesgos si se omite esa intervención

### 3. Estructura de carpetas recomendada
Propón una estructura concreta para `.agents/` y `/docs/` que incluya como mínimo:
- roles
- workflows
- templates
- checklists
- specs
- test-plans
- adrs
- contracts
- runbooks
- threat-models

La estructura debe verse como árbol de carpetas.

### 4. Archivos que deben crearse
Genera el contenido inicial de los archivos clave, listo para copiar al repo.

Como mínimo quiero:
- `.agents/orchestrator.md`
- `.agents/roles/spec-writer.md`
- `.agents/roles/frontend-builder.md`
- `.agents/roles/backend-builder.md`
- `.agents/roles/qa-test-designer.md`
- `.agents/roles/code-reviewer.md`
- `.agents/roles/security-reviewer.md`
- `.agents/roles/docs-keeper.md`
- `.agents/roles/anti-hallucination-reviewer.md`
- `.agents/workflows/feature-flow.md`
- `.agents/workflows/bugfix-flow.md`
- `.agents/templates/adr-template.md`
- `.agents/templates/pr-template.md`
- `.agents/templates/test-case-template.md`
- `.agents/checklists/frontend-dod.md`
- `.agents/checklists/backend-dod.md`
- `.agents/checklists/pr-checklist.md`

Cada archivo debe venir con contenido completo en markdown.

### 5. Reglas operativas globales
Define reglas del sistema de subagentes, por ejemplo:
- ningún agente implementa sin spec aprobado
- ningún agente cierra tarea sin evidencia
- el implementador no puede autoaprobarse
- si cambia arquitectura se requiere ADR
- cada cambio debe actualizar spec/tests/docs según corresponda

Necesito una sección clara de “Protocolos obligatorios”.

### 6. Reglas especiales para Vibe Coding
Agrega una sección específica para equipos que programan con apoyo de IA.
Incluye reglas para:
- no inventar archivos o rutas inexistentes
- no usar librerías no instaladas
- no asumir contratos de API no definidos
- no mezclar código temporal con definitivo sin marcarlo
- siempre validar contra el repo real
- exigir evidencia funcional
- pedir explicación breve del razonamiento de la solución

### 7. Enfoque pedagógico
Como este proyecto lo usan alumnos, agrega lineamientos para que los subagentes también apoyen el aprendizaje.
Incluye recomendaciones sobre:
- explicar tradeoffs
- justificar decisiones
- convertir errores en lecciones
- evitar dependencia ciega de la IA

### 8. Priorización por etapas
No quiero que recomiendes implementar todo de golpe.
Divide tu propuesta en:
- MVP de subagentes
- segunda capa
- capa avanzada/pedagógica

Para cada etapa indica:
- qué roles incluir
- por qué
- impacto esperado

## Reglas de salida
- Responde en español.
- Sé concreto, útil y operativo.
- No des teoría genérica.
- No expliques qué es un subagente a nivel básico.
- Produce contenido listo para usarse en un repo real.
- Usa markdown limpio.
- Si detectas redundancias entre roles, consolídalas.
- Si detectas huecos importantes en el flujo actual, señálalos y propón cómo cubrirlos.
- Mantén compatibilidad con el SSDLC actual.
- Enfatiza separación de responsabilidades y evidencia verificable.
- Si algo no conviene para un equipo de alumnos, dilo claramente.

## Formato exacto de salida
Entrega en este orden:
1. Resumen ejecutivo
2. Arquitectura de subagentes propuesta
3. Tabla de intervención por fases
4. Árbol de carpetas recomendado
5. Contenido completo de los archivos propuestos
6. Protocolos obligatorios
7. Reglas de Vibe Coding
8. Enfoque pedagógico
9. Roadmap de adopción por etapas
10. Riesgos y recomendaciones finales