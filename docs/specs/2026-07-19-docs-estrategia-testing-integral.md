# Spec: Estrategia integral de pruebas — fase base

## Metadata
- **Tipo:** docs
- **Complejidad:** L
- **Fecha:** 2026-07-19
- **Estado:** IN PROGRESS

## Historia

Como equipo que mantiene este proyecto, necesitamos una estrategia de pruebas integral y documentada que integre lo que ya existe en backend, frontend y E2E en una sola matriz de trazabilidad, identifique gaps reales de cobertura, y deje un backlog priorizado y ejecutable — sin reescribir tests que ya funcionan ni inventar problemas que no existen.

- **Específica:** auditar el estado real de testing (ya hecho vía 2 agentes Explore), producir 5 documentos en `docs/testing/` (estrategia, matriz, datos, comandos, issues conocidos), aplicar 6 fixes concretos y acotados (sin escribir tests nuevos), y registrar ~20 gaps de cobertura como ítems de backlog priorizados.
- **Medible:** los 5 documentos existen con contenido verificado contra el código real (sin módulos/escenarios inventados); los 6 fixes no cambian comportamiento de aplicación; `docs/backlog.md` tiene los ítems `TEST-001` a `TEST-020` con prioridad y nivel de prueba.
- **Alcanzable:** se reusa la auditoría ya hecha (no se re-explora desde cero); se reusan los checks de contrato ya existentes en `anti-hallucination-reviewer` en vez de introducir Zod/OpenAPI; el trabajo de escribir tests nuevos queda fuera de esta iteración, delegado al pipeline `qa-test-designer`→`backend-tester`/`frontend-tester` ya versionado.
- **Relevante:** sin esto, no hay forma de saber qué está realmente cubierto vs qué se asume cubierto, y los gaps reales (endpoint sin test, función muerta con bug, CI que no genera el artifact que dice generar) quedan invisibles.
- **Temporal:** complejidad L — 5 documentos nuevos + 6 archivos modificados/eliminados + backlog, sin escribir tests nuevos.

## Contexto

El usuario pidió una estrategia integral de pruebas de 16 fases (auditoría, mapa funcional, pirámide, cobertura por nivel, contratos, datos de prueba, matriz, CI, documentación). La auditoría real (2 agentes Explore, backend + frontend, ejecutando la suite real en ambos casos) confirma que ya existe una base sólida: backend 180/180 tests reales con 86.9% de cobertura y thresholds ya configurados; frontend 52 tests unitarios + 16 E2E con Cypress, wrapper de providers, mocks funcionando. Pero hay gaps reales: un endpoint de producción sin test (`GET /payment-methods/me`), una función de controller nunca montada con un bug propio (`addProductToCart`), ausencia de validación de `totalPrice`/stock en `createOrder`, ~28 componentes/páginas de frontend sin test dedicado, una dependencia instalada pero no usada (`msw`), código muerto duplicado (`setupPolyfills.js`), un bug de CI donde el artifact de cobertura nunca se genera, y ausencia total de CI para el backend. Además, el propio harness de agentes recién versionado (`.claude/agents/frontend-tester.md`) mandata MSW cuando el proyecto real usa `axios-mock-adapter` — se corrige aquí.

Escribir los 20-40+ tests que cerrarían todos los gaps de una sola vez viola la propia instrucción del usuario de no implementar todo a ciegas sin checkpoints. Se acordó con el usuario limitar esta sesión a la base (diagnóstico + matriz + docs + fixes acotados) y dejar la escritura de tests nuevos como backlog priorizado para ciclos siguientes.

**Nota de rama:** esta rama (`docs/estrategia-testing-integral`) se creó apilada sobre `infra/model-agent-harness` (no sobre `develop`), porque necesita editar archivos (`.claude/agents/frontend-tester.md`, `.agents/roles/frontend-tester.md`) que solo existen en esa rama — el PR #1 (harness) todavía no está mergeado a `develop`. El PR de este pendiente mostrará el diff combinado hasta que el PR #1 se mergee.

## Criterios de Aceptación

- [ ] CA-1: `docs/testing/strategy.md`, `test-matrix.md`, `test-data.md`, `running-tests.md`, `known-issues.md` existen, con contenido verificado contra el código real (sin invención).
- [ ] CA-2: Los 6 fixes concretos aplicados (CI frontend, CI backend nuevo, tabla resumen del test-plan, mapa de rutas en CLAUDE.md, corrección MSW→axios-mock-adapter en frontend-tester, eliminación de `setupPolyfills.js`), ninguno cambia comportamiento de la aplicación.
- [ ] CA-3: `docs/backlog.md` tiene los 20 ítems `TEST-001` a `TEST-020` con prioridad y nivel de prueba, sin duplicar `INFRA-XXX`/`BUG-XXX` existentes.
- [ ] CA-4: `cd ecommerce-api && npm test` y `cd ecommerce-app && npm test -- --watchAll=false` siguen pasando (o con el mismo resultado preexistente) después de los 6 fixes.
- [ ] CA-5: El trabajo pasa por el loop de revisión (`anti-hallucination-reviewer` + `code-reviewer` pre-PR, `tech-reviewer` post-PR) y se entrega en PR contra `develop`.

## Consideraciones de Seguridad

- **Amenazas STRIDE identificadas:** ninguna en sentido estricto — este pendiente es documentación, CI, y eliminación de código muerto confirmado. El hallazgo de `TEST-002` (sin validación de `totalPrice`/stock en `createOrder`) es en sí mismo un hallazgo de *Tampering* — un cliente puede enviar cualquier total — pero se registra como backlog para corrección futura, no se corrige en este pendiente.
- **Controles de mitigación:** no aplica (no se toca lógica de negocio).
- **Inputs que requieren validación:** no aplica.
- **Secrets involucrados:** ninguno.
- **Superficie de ataque afectada:** ninguna en producción — cambios en `docs/`, `.github/workflows/`, `.claude/agents/`, `.agents/roles/`, y eliminación de un archivo de frontend sin referencias.

## Dependencias

- **Internas:** reusa la auditoría ya realizada (2 agentes Explore), el pipeline de agentes ya versionado (`qa-test-designer`, `backend-tester`, `frontend-tester`, `test-reviewer`) para el trabajo de tests futuro, y los checks de `anti-hallucination-reviewer` para "contract testing" en vez de tooling nuevo.
- **Externas:** ninguna dependencia nueva se introduce (se descarta explícitamente agregar Zod/OpenAPI).

## Decisiones de Diseño

1. **No escribir tests nuevos en esta iteración** — decisión explícita del usuario tras plantear la opción; se prioriza dejar la base correcta y un backlog accionable sobre intentar cerrar 20-40 gaps sin checkpoints.
2. **Contract testing sin dependencia nueva** — se documenta que `anti-hallucination-reviewer` ya verifica campos de modelo y rutas montadas entre frontend/backend; agregar Zod/OpenAPI no se justifica para el tamaño de este proyecto.
3. **No renombrar `mocks/server.js`/`handlers.js`** pese a que el nombre sugiere MSW y el código real usa `axios-mock-adapter` — renombrar tocaría 52 tests que ya pasan sin ningún beneficio funcional. Se corrige la documentación (que sí describe mal la realidad), no el código que funciona.
4. **Prefijo `TEST-` para los ítems de backlog nuevos** — evita mezclar con `INFRA-XXX` (harness) y `BUG-XXX` (bugs de aplicación ya registrados).
5. **Rama apilada sobre `infra/model-agent-harness`** — necesaria porque el pendiente edita archivos que solo existen ahí; el PR objetivo sigue siendo `develop` según convención SSDLC.

## Riesgos y Deuda Técnica

- El diff de este PR se verá combinado con el de `infra/model-agent-harness` hasta que ese PR se mergee — riesgo cosmético de revisión, no funcional.
- `TEST-002` (sin validación de total/stock) es un hallazgo de severidad real que queda sin corregir en este pendiente, solo registrado.
- `TEST-006` (destino de `addProductToCart`) requiere una decisión de arquitectura antes de poder ejecutarse — no se resuelve aquí.

## Pendientes Abiertos y Gaps Detectados

- **Funcionalidades faltantes:** ninguna respecto al alcance acordado (base, no implementación de tests nuevos).
- **Comportamientos inconsistentes detectados:** ver hallazgos de la auditoría (payment-methods/me sin test, addProductToCart huérfana con bug, sin validación de total/stock, CI de cobertura roto, MSW instalado sin usar, setupPolyfills.js muerto, tabla resumen del test-plan desactualizada).
- **Gaps entre frontend y backend:** ninguno nuevo — los ya conocidos (DEF-01 a DEF-04) se consolidan en `known-issues.md`, no se corrigen aquí.
- **Persistencia pendiente de migrar:** no aplica.
- **Decisiones aplazadas:** destino de `addProductToCart` (`TEST-006`), si conviene un `package.json` raíz (`TEST-019`), thresholds de cobertura frontend (`TEST-014`, requiere medir primero).
- **Trabajo fuera de alcance en esta iteración:** escritura de los 20 ítems `TEST-XXX` (tests nuevos) — queda como backlog priorizado para el pipeline de agentes.
- **Riesgos que requieren seguimiento:** `TEST-002` (validación de dinero) es el de mayor severidad real pendiente.
- **Items que deben convertirse en backlog:** los 20 ítems `TEST-001` a `TEST-020` — ver sección de backlog más abajo, se agregan a `docs/backlog.md` como parte de este mismo pendiente.

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
