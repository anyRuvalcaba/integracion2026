# Reglas de Vibe Coding con IA

**Aplica a:** cualquier agente que use IA generativa para implementar o revisar código en este proyecto.

---

## Por qué estas reglas existen

Vibe Coding es un enfoque de desarrollo asistido por IA donde la velocidad de generación puede superar la velocidad de verificación. El resultado, sin disciplina, son bases de código con referencias inventadas, contratos de API asumidos, librerías fantasma y lógica duplicada. Estas reglas existen para mantener la ventaja de velocidad sin perder la corrección.

---

## Reglas

### VC-01 — No inventar archivos ni rutas
Antes de escribir un import, verificar que el archivo existe:
```bash
ls ecommerce-api/src/models/NombreModelo.js
ls ecommerce-app/src/services/nombreServicio.js
```
Si el archivo no existe y el pendiente no incluye crearlo → escalar al orchestrator.

### VC-02 — No usar librerías no instaladas
Antes de usar cualquier librería, verificar en `package.json`:
```bash
cat ecommerce-api/package.json | grep "librería"
cat ecommerce-app/package.json | grep "librería"
```
Si no está instalada y el pendiente no incluye instalarla → no usarla. Alternativa: usar lo que ya está instalado.

### VC-03 — No asumir contratos de API no definidos
Antes de llamar a un endpoint desde el frontend, verificar en `CLAUDE.md` §mapa-de-rutas:
- ¿Existe la ruta?
- ¿Está montada en `routes/index.js`?
- ¿Qué nivel de auth requiere?
- ¿Qué formato tiene el response?

Si el endpoint no existe → no crear la llamada. Documentar la necesidad como pendiente.

### VC-04 — No mezclar código temporal con definitivo sin marcarlo
Si durante la implementación se necesita código provisional (hardcoded para testing, mock temporal, etc.), marcarlo explícitamente:
```js
// PROVISIONAL — reemplazar con llamada a API en T-XXX
const addresses = [{ id: "1", address: "Calle temporal" }];
```
Y registrar el T-XXX en `## Pendientes Abiertos` del spec.

### VC-05 — Validar contra el repo real antes de reportar
Antes de reportar que el trabajo está listo, ejecutar:
```bash
# Backend
cd ecommerce-api && npm test

# Frontend
cd ecommerce-app && npm test -- --watchAll=false
```
No reportar "funciona" basándose solo en la generación del código. Ejecutar.

### VC-06 — Exigir evidencia funcional
Cuando un agente reporta que un CA está cumplido, debe incluir evidencia:
- Backend: output del test que verifica el CA, o captura de la petición HTTP.
- Frontend: descripción de la interacción del usuario que verifica el CA, o captura de pantalla.

"El código está escrito" no es evidencia de que el CA está cumplido.

### VC-07 — Explicar el razonamiento
Cuando un agente toma una decisión de implementación no obvia, debe incluir en su reporte:
```
Razonamiento: [por qué se eligió este enfoque y no el alternativo más obvio]
```
Esto permite al orchestrator detectar si el razonamiento fue correcto o si hay una alucinación de contexto.

### VC-08 — Verificar campos contra el modelo real antes de usarlos
Antes de escribir `item.productId` en un contexto de carrito, leer el schema de Cart:
```js
// Cart.js — products[]: { product: ObjectId, quantity: Number }
// El campo es "product", no "productId"
```
Este tipo de error es el más frecuente en Vibe Coding con IA y el más costoso de detectar.

### VC-09 — No propagar errores silenciosos
Si una llamada a la API puede fallar, el agente debe:
1. Manejar el error (no dejar un `.catch(() => {})` vacío).
2. Usar `classifyError()` del `apiClient.js` para determinar el tipo de error.
3. Mostrar feedback al usuario o redirigir según el tipo.

Un error silencioso que hace que el carrito "no funcione" sin mensaje de error es peor que un crash visible.

### VC-10 — Los nombres de variables de estado son sagrados
Una vez definido `const [cartid, setCartid] = useState(null)`, el nombre `cartid` no cambia a `cartId` en ninguna parte del mismo archivo. La IA tiende a cambiar el case silenciosamente; verificar consistencia antes de reportar.
