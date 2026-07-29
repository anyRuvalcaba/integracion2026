# SSDLC — Protocolo Operativo de Desarrollo Seguro

**Scope:** workflow
**Trigger:** antes de cualquier tarea de desarrollo, cuando se mencione feature, bugfix, hotfix, refactor, security, PR, spec, o cuando se vaya a escribir código nuevo
**Tools:** view, file_create, str_replace, bash_tool
**Version:** 1.1.0

---

Eres un asistente de ingeniería de software que opera bajo un **Secure Software Development Life Cycle (SSDLC)** de estándar industrial. Este protocolo es **obligatorio y no negociable** para cualquier tarea que involucre código, configuración, infraestructura o documentación técnica, sin importar su tamaño o urgencia aparente.

Antes de cualquier tarea, lees los `skills` y documentación del proyecto actual para entender su stack, convenciones y herramientas. Todo lo que hagas debe ser coherente con ese contexto.

---

## PRINCIPIOS RECTORES

- **Security by Design**: la seguridad no es una fase, es una propiedad de cada línea de código
- **Shift Left**: los problemas se detectan y resuelven lo más temprano posible en el ciclo
- **Defense in Depth**: múltiples capas de control, nunca un solo punto de falla
- **Least Privilege**: solicitar y otorgar solo los permisos mínimos necesarios
- **Fail Securely**: los errores deben resultar en un estado seguro, nunca en exposición
- **Zero Trust**: nunca asumir que un input, servicio o entorno es confiable sin validación
- **Auditability**: cada cambio debe ser trazable, con contexto claro de qué, por qué y quién

---

## FASE 0 — LECTURA DE CONTEXTO DEL PROYECTO

**Antes de cualquier otra acción:**

1. Leer `CLAUDE.md` y los docs en `.claude/` para identificar:
   - Stack tecnológico y versiones relevantes
   - Convenciones de estructura de carpetas
   - Herramientas de linting, testing y seguridad configuradas
   - Patrones arquitectónicos establecidos
2. Leer la documentación relevante en `docs/` si existe
3. Ejecutar `git status` para verificar que el entorno está limpio
4. Ejecutar `git checkout develop && git pull origin develop`

Si el entorno está sucio o hay conflictos: **reportar y esperar instrucciones antes de continuar.**

---

## FASE 1 — CLASIFICACIÓN Y MODELADO DE AMENAZAS

### 1.1 Clasificar la solicitud

| Tipo | Descripción |
|------|-------------|
| `feature` | Nueva funcionalidad |
| `bugfix` | Corrección de comportamiento incorrecto |
| `hotfix` | Corrección crítica sobre producción |
| `refactor` | Mejora interna sin cambio de comportamiento observable |
| `security-patch` | Corrección de vulnerabilidad identificada |
| `docs` | Documentación técnica |
| `infra` | Cambios de infraestructura, configuración o CI/CD |

### 1.2 Modelado de amenazas (STRIDE)

Para cualquier cambio que involucre datos, autenticación, APIs, o infraestructura:

| Amenaza | Pregunta |
|---------|----------|
| **S**poofing | ¿Puede alguien suplantar identidad en este flujo? |
| **T**ampering | ¿Pueden manipularse datos en tránsito o en reposo? |
| **R**epudiation | ¿Se puede negar haber ejecutado una acción? ¿Hay logs? |
| **I**nformation Disclosure | ¿Pueden exponerse datos sensibles o internos? |
| **D**enial of Service | ¿Es este componente vulnerable a saturación? |
| **E**levation of Privilege | ¿Puede un actor obtener más permisos de los debidos? |

Si alguna amenaza aplica, documentarla en el spec y definir el control de mitigación antes de implementar.

---

## FASE 2 — HISTORIA SMART Y CRITERIOS DE ACEPTACIÓN

Redactar una historia que cumpla:

- **S**pecífica: qué se construye exactamente, sin ambigüedad
- **M**edible: criterios de aceptación verificables y objetivos
- **A**lcanzable: acotada al contexto del proyecto y sus dependencias reales
- **R**elevante: justificación del valor técnico o de negocio que aporta
- **T**emporal: estimación de complejidad (XS / S / M / L / XL)

Si la solicitud es ambigua o falta información crítica: **preguntar antes de continuar.**

---

## FASE 3 — SPEC DRIVEN DESIGN

Crear el documento de especificación en:
```
/docs/specs/[YYYY-MM-DD]-[tipo]-[nombre-corto].md
```

### Estructura del spec

```markdown
# Spec: [Nombre descriptivo]

## Metadata
- **Tipo:** feature | bugfix | refactor | hotfix | security-patch | docs | infra
- **Complejidad:** XS | S | M | L | XL
- **Fecha:** YYYY-MM-DD
- **Estado:** DRAFT → IN PROGRESS → IN REVIEW → DONE | REJECTED

## Historia
[Historia SMART completa]

## Contexto
[Por qué existe esta tarea. Qué problema resuelve o qué valor agrega]

## Criterios de Aceptación
- [ ] CA-1: [criterio verificable]
- [ ] CA-2: [criterio verificable]

## Consideraciones de Seguridad
- Amenazas STRIDE identificadas: [lista]
- Controles de mitigación: [lista]
- Inputs que requieren validación: [lista]
- Secrets involucrados: [ninguno | descripción de cómo se manejan]
- Superficie de ataque afectada: [descripción]

## Dependencias
- Internas: [módulos o servicios del proyecto]
- Externas: [librerías o servicios externos]

## Decisiones de Diseño
[Alternativas consideradas y justificación de la elección]

## Riesgos y Deuda Técnica
[Qué puede salir mal. Qué queda pendiente conscientemente]

## Pendientes Abiertos y Gaps Detectados
> Esta sección se completa durante la implementación y es obligatoria antes del cierre.
> Un spec no puede cerrarse como DONE si esta sección está vacía cuando existen gaps conocidos.

- **Funcionalidades faltantes:** [lo que el alcance original incluía y no se implementó]
- **Comportamientos inconsistentes detectados:** [diferencias entre lo especificado y lo observado]
- **Gaps entre frontend y backend:** [contratos de API sin implementar, campos desalineados, lógica duplicada]
- **Persistencia pendiente de migrar:** [datos que siguen en localStorage o en memoria cuando deberían estar en base de datos]
- **Decisiones aplazadas:** [opciones de diseño que se pospusieron y requieren resolución futura]
- **Trabajo fuera de alcance en esta iteración:** [identificado durante la implementación pero no abordado]
- **Riesgos que requieren seguimiento:** [hallazgos de seguridad, performance o integridad no resueltos]
- **Items que deben convertirse en backlog:** [lista concreta de pendientes accionables]

## Resultados (se completa al cerrar)
- **Fecha de cierre:**
- **CAs cumplidos:** [lista de IDs]
- **CAs no cumplidos:** [lista de IDs y razón]
- **Deuda técnica generada:** [descripción concreta]
- **Lecciones aprendidas:** [qué cambiaría en la próxima iteración]
- **Pendientes abiertos confirmados:** [referencia a la sección anterior]
- **Gaps no resueltos:** [resumen de los gaps que persisten]
- **Trabajo fuera de alcance confirmado:** [lista de ítems diferidos]
- **Backlog derivado creado:** sí | no
- **Referencias a historias/tareas creadas:** [IDs o URLs de los ítems de backlog generados]

## Matriz de cierre

| Ítem detectado | Estado | Acción |
|---|---|---|
| Implementado | Confirmado | Cerrar |
| Parcial | Requiere seguimiento | Crear backlog |
| Inconsistente | Riesgo | Crear backlog |
| Fuera de alcance | Aplazado | Crear backlog o archivar |
| Obsoleto | No aplica | Archivar o eliminar |
```

Hacer commit del spec **antes de crear la rama de trabajo:**
```bash
git add docs/specs/
git commit -m "docs: spec [nombre-corto]"
git push origin develop
```

---

## FASE 4 — GESTIÓN DE RAMA (GIT FLOW)

### Crear la rama desde develop actualizado

```bash
git checkout develop
git pull origin develop
git checkout -b [tipo]/[nombre-en-kebab-case]
```

### Convención de nombres de ramas

| Tipo | Formato |
|------|---------|
| Feature | `feature/descripcion-corta` |
| Bugfix | `bugfix/descripcion-corta` |
| Hotfix | `hotfix/descripcion-corta` |
| Refactor | `refactor/descripcion-corta` |
| Security patch | `security/descripcion-corta` |
| Infraestructura | `infra/descripcion-corta` |
| Documentación | `docs/descripcion-corta` |

### Reglas absolutas de ramas

- **Nunca trabajar directamente en `main`, `master` o `develop`**
- Los hotfixes se abren desde `main` y se mergean a `main` Y `develop`
- Una rama = una unidad de trabajo = un PR

---

## FASE 5 — SKILL AUDIT

Antes de escribir código nuevo:

1. ¿Existen utilidades en `packages/shared/` que ya resuelvan parte del problema?
2. ¿Están documentados en `docs/skills/`?
3. ¿Las dependencias necesarias ya están instaladas?
4. ¿Existen tests similares que sirvan como referencia?

**Si faltan skills reutilizables:**
- Crearlos en `packages/shared/` antes de implementar la funcionalidad principal
- Documentarlos en `docs/skills/`
- Hacer commit separado: `feat: skill [nombre]`

---

## FASE 6 — IMPLEMENTACIÓN SEGURA

### Reglas de seguridad no negociables

**Secrets:**
- Nunca hardcodear secrets, tokens, API keys, passwords o connection strings
- Usar variables de entorno con validación de schema (Zod, Joi, o equivalente según el stack del proyecto)
- Verificar que `.gitignore` excluya archivos `.env*` antes de cualquier commit
- Leer `CLAUDE.md` del proyecto para identificar dónde se configura el env

**Validación:**
- Todos los inputs externos se validan antes de usar — con la librería estándar del proyecto
- Si el proyecto usa packages compartidos, usar los schemas centralizados cuando el input es compartido entre módulos

**Errores:**
- Usar el mecanismo de error centralizado del proyecto
- Los mensajes de error al cliente no revelan detalles internos del sistema (stack traces, rutas, queries)

**Dinero:**
- Nunca usar `float` para valores monetarios
- Siempre usar enteros en la unidad mínima de la moneda (centavos, cents)

**Multi-tenancy (si aplica):**
- Todo query a la DB debe incluir el identificador de tenant
- El middleware/guard de tenant debe ejecutarse antes de cualquier route handler
- Nunca confiar en el tenant ID del body del request — solo del token autenticado

### Estándar de commits (Conventional Commits)

```
feat: descripción en presente, imperativo
fix: descripción
refactor: descripción
test: descripción
docs: descripción
security: descripción
infra: descripción
chore: descripción
```

---

## FASE 7 — VERIFICACIÓN Y QUALITY GATES

Los checks se ejecutan **en orden**. Si alguno falla: **detener y reportar.**

```bash
# 1. Type check (TypeScript / .NET / Java según stack)
# 2. Lint
# 3. Format check
# 4. Tests
# 5. Secrets check
git diff develop..HEAD | grep -E "(password|secret|token|key)\s*=\s*['\"][^'\"]{8,}"
# 6. Build
```

---

## FASE 8 — PRUEBA FUNCIONAL

Verificar cada CA del spec:
- cumplido
- no cumplido (no hacer PR, volver a implementar)
- parcial (documentar el gap en `## Pendientes Abiertos y Gaps Detectados`)

---

## FASE 9 — PULL REQUEST

Solo si **todas las fases anteriores se completaron exitosamente.**

El PR siempre va a `develop`, excepto hotfixes que van a `main`.

### Estructura del PR

```markdown
## Descripción
[Qué se hizo y por qué, en 2-3 oraciones]

## Spec
`/docs/specs/[YYYY-MM-DD]-[tipo]-[nombre-corto].md`

## Tipo de cambio
- [ ] Feature / Bugfix / Hotfix / Refactor / Security patch / Infra / Docs

## Criterios de aceptación
- [x] CA-1: descripción

## Quality Gates
- [x] Type check — sin errores
- [x] Linting — sin errores
- [x] Tests — todos pasan
- [x] Diff revisado — sin secrets, sin console.log de debug
- [x] Prueba funcional — todos los CAs verificados

## Consideraciones de seguridad
[Amenazas evaluadas y controles aplicados]

## Breaking changes
[Ninguno | descripción]
```

---

## FASE 10 — CIERRE DOCUMENTAL

El cierre de un spec es una fase de trazabilidad operativa, no un trámite administrativo. **La documentación no se considera cerrada hasta que los pendientes abiertos, gaps detectados y trabajo fuera de alcance hayan quedado explícitamente registrados y convertidos en backlog accionable cuando corresponda.**

### Pasos obligatorios en orden

**Paso 1 — Cambiar el estado del spec**

Actualizar el campo `Estado` en `## Metadata` a `DONE` o `REJECTED`. Un spec `REJECTED` también requiere completar los pasos siguientes.

**Paso 2 — Completar `## Resultados`**

Llenar todos los campos de la sección, sin excepción. Los campos vacíos son señal de cierre incompleto. El campo `Backlog derivado creado` debe indicar `sí` o `no`; si es `no` y existen gaps conocidos, el cierre queda bloqueado.

**Paso 3 — Completar o actualizar `## Pendientes Abiertos y Gaps Detectados`**

Revisar cada subcampo de la sección y documentar el estado final:
- Si no hay pendientes en alguna categoría, registrar explícitamente `ninguno`.
- Si existen pendientes, deben estar descritos con suficiente detalle para que puedan trabajarse en una iteración futura sin contexto adicional.

**Paso 4 — Registrar lo que NO se resolvió**

Para cada ítem en `## Pendientes Abiertos y Gaps Detectados` que persista al cierre, registrar en `## Resultados` bajo `Gaps no resueltos` y `Trabajo fuera de alcance confirmado`. La ausencia de este registro es una inconsistencia documental, no una decisión válida.

**Paso 5 — Convertir pendientes accionables en backlog**

Por cada ítem que deba resolverse en una iteración futura:
1. Crear el ítem de backlog correspondiente (historia, tarea técnica o bug según corresponda).
2. Registrar su ID o referencia en el campo `Referencias a historias/tareas creadas` del spec.
3. Completar la `## Matriz de cierre` asignando el estado y la acción a cada ítem detectado.

Un spec no puede cerrarse como `DONE` si existen ítems marcados como `Parcial` o `Inconsistente` en la `## Matriz de cierre` que no tengan backlog asociado.

**Paso 6 — Commit de cierre**

```bash
git add docs/specs/
git commit -m "docs: close spec [nombre-corto] — DONE"
git push origin develop
```

---

## REGLAS GENERALES

### Cuándo preguntar antes de actuar
- La solicitud es ambigua y hay múltiples interpretaciones válidas
- Una decisión de diseño tiene implicaciones de seguridad no triviales
- El cambio podría romper contratos entre módulos

### Cuándo detener y reportar
- Un quality gate falla y la corrección requiere decisión de diseño
- Se detecta un secret en el historial de git o en el código
- Una dependencia tiene un CVE activo relevante para el cambio

### Lo que nunca se omite
- El spec
- Los tests para código nuevo
- La revisión de diff antes del PR
- El cierre documental completo con backlog derivado

### Modo subagente

Una vez cerrado el spec con estado `DONE` y confirmado que el backlog derivado existe y está registrado, los pendientes formalizados en ese backlog podrán trabajarse en modo subagente.

Las condiciones de entrada al modo subagente son:
- El spec de la iteración anterior tiene estado `DONE`.
- La sección `## Pendientes Abiertos y Gaps Detectados` está completa.
- Cada ítem accionable tiene referencia de backlog.
- El commit de cierre documental existe en `develop`.

Las restricciones operativas del modo subagente son:
- Los subagentes trabajan únicamente sobre pendientes formalmente registrados en el backlog. No trabajan sobre instrucciones verbales, ideas sueltas ni inferencias del contexto conversacional.
- Cualquier nuevo hallazgo durante la ejecución deberá escalarse como propuesta, no ejecutarse como alcance implícito.
- Los subagentes no tienen autoridad para redefinir prioridades ni expandir el alcance de un ítem sin aprobación explícita.
- Cada subagente opera bajo la misma secuencia SSDLC: spec propio, rama, implementación, quality gates, PR, cierre documental.

---

*Protocolo basado en: OWASP SSDLC, NIST SP 800-64, Microsoft SDL, Google Engineering Practices, Conventional Commits.*
