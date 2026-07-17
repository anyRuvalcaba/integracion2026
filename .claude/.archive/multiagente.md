Quiero que actúes como un Staff Engineer + Software Architect + experto en SSDLC multiagente.

Voy a darte mi documento actual de protocolo SSDLC. Tu tarea NO es resumirlo ni comentarlo superficialmente. Tu tarea es REESCRIBIRLO y AJUSTARLO directamente para incorporar un modelo formal de ejecución con agente principal y subagentes.

## CONTEXTO DEL CAMBIO
Mi SSDLC ya cubre el flujo general de trabajo por tarea/spec, pero ahora necesito que quede explícitamente preparado para operar en dos etapas:

### ETAPA 1 — Baseline documental y técnico
Primero se documenta el proyecto, se audita lo existente, se limpia la documentación, se registran los gaps y se consolida un backlog derivado.

### ETAPA 2 — Ejecución de pendientes en modo subagente
Una vez cerrado el baseline documental y técnico y guardado en Git, quiero que los pendientes posteriores se trabajen en modo subagente.

## PROBLEMA A CORREGIR
El protocolo actual no define claramente:
- cuándo termina la etapa documental y comienza la ejecución por pendientes,
- cómo se establece el baseline oficial del proyecto,
- qué autoridad tiene el agente principal,
- qué autoridad tienen los subagentes,
- cómo se divide el trabajo,
- qué restricciones operativas tienen los subagentes,
- y cómo se integra el trabajo sin romper consistencia, seguridad ni trazabilidad.

## OBJETIVO DEL AJUSTE
Quiero que el SSDLC quede preparado para un modelo de trabajo donde:
- el agente principal actúa como orquestador,
- los subagentes ejecutan pendientes delimitados,
- cada pendiente se trabaja de forma aislada y trazable,
- no se inventa alcance nuevo,
- y toda integración queda controlada.

## INSTRUCCIONES DE EDICIÓN
Debes trabajar SOBRE el documento actual y devolverme una versión mejorada del SSDLC, conservando su estilo, tono, estructura y disciplina operativa.

Haz estos cambios de forma explícita:

---

### CAMBIO 1 — Definir el baseline oficial del proyecto
Agrega una sección clara que indique que, una vez terminada la documentación base del sistema y consolidado el backlog derivado, debe generarse un baseline oficial del proyecto en Git.

Debe incluir como mínimo:
- commit de consolidación documental/técnica,
- referencia a `develop` como punto de partida operativo,
- recomendación de crear un tag de baseline,
- declaración de que desde ese momento:
  - código + documentación vigente + backlog aprobado
  son la fuente oficial de verdad para el trabajo posterior.

Incluye un ejemplo de commit y un ejemplo de tag.

---

### CAMBIO 2 — Definir el modo subagente
Agrega una nueva sección o fase llamada explícitamente algo equivalente a:

## Modo de Ejecución con Subagentes

Esa sección debe explicar que, después del baseline, el protocolo cambia de modo:
- deja de ser exploratorio/documental,
- pasa a ser ejecución orquestada de pendientes formales.

Debe dejar claro que:
- los subagentes no trabajan sobre ideas sueltas,
- solo trabajan sobre backlog formalmente registrado,
- el backlog aprobado es la única fuente válida para tomar trabajo,
- cualquier hallazgo nuevo debe escalarse como propuesta, no ejecutarse automáticamente.

---

### CAMBIO 3 — Definir el modelo de autoridad
Quiero una sección clara que defina roles y autoridad:

#### Agente principal
Debe actuar como:
- orquestador,
- priorizador,
- guardián de consistencia,
- responsable de integración final.

#### Subagentes
Deben actuar como:
- ejecutores especializados,
- responsables de una sola unidad de trabajo,
- sin autoridad para redefinir arquitectura global,
- sin autoridad para cambiar prioridades globales,
- sin autoridad para expandir el alcance por cuenta propia.

Incluye reglas explícitas como:
- el agente principal interpreta el backlog,
- los subagentes ejecutan,
- los subagentes no rediseñan el roadmap,
- cualquier cambio de alcance debe regresar al agente principal como propuesta.

---

### CAMBIO 4 — Definir la unidad mínima de trabajo
Quiero que el SSDLC establezca una regla fuerte e inequívoca:

**1 pendiente = 1 spec = 1 rama = 1 PR**

Debes dejar claro que cada subagente trabaja únicamente una unidad delimitada, por ejemplo:
- una historia de usuario,
- un bug,
- un refactor acotado,
- una tarea técnica específica,
- un hardening puntual.

También debes dejar claro que:
- no se deben mezclar múltiples pendientes en la misma rama,
- no se deben agrupar tareas no relacionadas,
- no se debe abrir trabajo sin spec propio.

---

### CAMBIO 5 — Definir entradas obligatorias para cada subagente
Agrega una sección que indique qué información mínima debe recibir un subagente antes de comenzar.

Incluye al menos:
- ID del pendiente,
- historia o tarea asignada,
- criterios de aceptación,
- contexto funcional,
- contexto técnico,
- documentación del módulo,
- dependencias conocidas,
- restricciones de seguridad,
- definición de terminado.

---

### CAMBIO 6 — Definir el flujo operativo por subagente
Quiero que el SSDLC deje explícito el flujo completo de ejecución por subagente.

Debe verse algo así:
1. El agente principal selecciona el pendiente desde el backlog oficial.
2. El subagente clasifica el trabajo.
3. El subagente redacta su spec.
4. El subagente crea su rama desde `develop`.
5. El subagente implementa.
6. El subagente ejecuta quality gates.
7. El subagente actualiza el spec con resultados.
8. El subagente devuelve evidencia al agente principal.

Debes dejarlo con wording profesional y consistente con el resto del documento.

---

### CAMBIO 7 — Definir la salida obligatoria de un subagente
Agrega una sección que indique qué debe entregar un subagente al finalizar.

Debe incluir:
- resumen de cambios,
- criterios de aceptación cumplidos/no cumplidos,
- evidencia de pruebas,
- riesgos detectados,
- deuda técnica generada,
- pendientes nuevos detectados,
- impacto en documentación,
- recomendación de integración.

Debe quedar claro que el subagente NO hace la integración final de manera autónoma.

---

### CAMBIO 8 — Definir responsabilidades del agente principal al consolidar
Agrega una sección donde el agente principal, al recibir trabajo de uno o más subagentes, debe:
- revisar consistencia con el baseline,
- revisar consistencia con backlog y spec,
- detectar duplicados,
- detectar conflictos entre ramas,
- homologar criterios,
- validar dependencias cruzadas,
- ordenar integración,
- preparar o validar PR final hacia `develop`.

---

### CAMBIO 9 — Definir reglas de escalamiento
Quiero una sección clara para dudas y hallazgos.

Debe indicar que:
- los subagentes no deben resolver ambigüedades inventando,
- deben escalar al agente principal,
- el escalamiento debe incluir:
  - la duda,
  - opciones viables,
  - impacto técnico/funcional/seguridad,
  - recomendación sugerida.

Debe quedar claro que:
- solo el agente principal decide si hace falta consultar al usuario,
- el subagente no debe interrumpir innecesariamente el flujo.

---

### CAMBIO 10 — Definir restricciones no negociables
Agrega una sección fuerte de restricciones.

Incluye reglas como:
- ningún subagente puede trabajar fuera del backlog aprobado,
- ningún subagente puede inventar alcance nuevo,
- ningún subagente puede saltarse spec, tests o quality gates,
- ningún subagente puede mezclar dos pendientes en una sola rama,
- ningún subagente puede tocar `main`, `master` o `develop` directamente,
- ningún subagente puede modificar documentación base sin justificarlo,
- ningún subagente puede considerar cerrado un trabajo sin actualizar el spec.

---

### CAMBIO 11 — Integrar sin romper el SSDLC existente
No quiero un apéndice desconectado.
No quiero que se vea como otro documento pegado con cinta.

Quiero que:
- el modo subagente quede integrado al SSDLC original,
- se note como una evolución natural,
- respete la secuencia ya existente,
- y tenga puntos de transición claros entre:
  - documentación / baseline
  - ejecución orquestada de pendientes

Puedes agregar una fase nueva intermedia, por ejemplo “FASE 10.5”, o una sección equivalente, si eso ayuda a la coherencia del documento.

---

### CAMBIO 12 — Mantener consistencia editorial
No quiero:
- texto redundante,
- cambios con tono distinto al documento actual,
- reglas duplicadas,
- contradicciones con las fases previas,
- explicaciones abstractas sin texto operativo.

Quiero:
- lenguaje preciso,
- reglas ejecutables,
- trazabilidad clara,
- consistencia con la disciplina SSDLC original.

## FORMA DE RESPONDER
Devuélveme la respuesta en este formato exacto:

# 1. Diagnóstico del hueco actual
Explica brevemente qué estaba faltando en el SSDLC original respecto al trabajo con subagentes.

# 2. Cambios propuestos
Lista concreta de los cambios que aplicarás.

# 3. SSDLC corregido
Entrégame el texto completo ya reescrito, listo para reemplazar el original.

## REGLAS IMPORTANTES
- No resumir el documento.
- No dar recomendaciones abstractas.
- No decir solamente “agrega una sección”.
- Debes devolver el texto final ya modificado.
- Conserva el espíritu SSDLC original.
- Sé estricto con trazabilidad, aislamiento del trabajo y control de integración.
- El modelo final debe dejar clarísimo que:
  - el agente principal orquesta,
  - los subagentes ejecutan,
  - y cada pendiente sigue la regla:
    1 pendiente = 1 spec = 1 rama = 1 PR.