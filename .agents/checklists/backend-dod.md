# Checklist — Backend Definition of Done

> Usado por `backend-builder` antes de reportar finalización y por `code-reviewer` al auditar.

---

## ESM y módulos

- [ ] Todos los imports locales usan extensión `.js` explícita
- [ ] No hay `require()` en ningún archivo
- [ ] No hay imports de librerías no instaladas en `package.json`

## Controllers

- [ ] Todas las funciones de controller son `async`
- [ ] Cada controller tiene `try/catch` con `next(error)` en el catch
- [ ] No hay `res.status(500)` manual; solo `next(error)`
- [ ] No hay lógica de negocio fuera del bloque `try`
- [ ] Las funciones están exportadas con `export { functionName }`

## Rutas

- [ ] Los middlewares están en el orden correcto: `authMiddleware` → `isAdmin` → `validators` → `validate` → `controller`
- [ ] `errorHandler` está registrado DESPUÉS de `app.use("/api", routes)` en `server.js`
- [ ] Cada ruta tiene su array de validadores declarado en el archivo de rutas (no en el controller)
- [ ] El middleware `validate` está presente en la cadena de cada ruta que tiene validadores

## Status codes

- [ ] `res.status(204)` usa `.send()`, no `.json(...)`
- [ ] Duplicado retorna 409 (no 400)
- [ ] Input inválido retorna 422 (validación) o 400 (lógica), no 404
- [ ] Recurso no encontrado retorna 404
- [ ] Sin autorización retorna 401
- [ ] Sin permisos retorna 403
- [ ] Creación exitosa retorna 201
- [ ] Lectura/actualización exitosa retorna 200

## Seguridad

- [ ] `password` no aparece en ningún response (usar `.select("-password")`)
- [ ] `cvv` no aparece en ningún response de PaymentMethod
- [ ] `userId` se toma de `req.user.userId` (token), nunca del body
- [ ] Ningún secret hardcodeado; todos en `process.env`
- [ ] Los ObjectId del body o params están validados con `.isMongoId()`

## Modelos y queries

- [ ] Los nombres de campo en `populate()` coinciden exactamente con el schema (verificar el modelo)
- [ ] Los nuevos modelos incluyen `{ timestamps: true }`
- [ ] No hay campos inexistentes referenciados en queries o populates

## Código limpio

- [ ] Sin `console.log` de debug
- [ ] Sin `debugger` statements
- [ ] Sin comentarios de tipo "TODO" no registrados en el backlog
- [ ] Sin código comentado (el código muerto se elimina, no se comenta)

## Testing

- [ ] Los quality gates pasan: `cd ecommerce-api && npm test`
- [ ] Si se creó nueva funcionalidad: el qa-test-designer tiene el plan de pruebas
- [ ] Si se encontraron bugs durante la implementación: documentados en `## Pendientes Abiertos` del spec

## Documentación

- [ ] El spec está actualizado: `## Resultados`, `## Pendientes Abiertos y Gaps Detectados`, `## Matriz de cierre`
- [ ] Estado del spec: `DONE`
- [ ] El reporte de salida está listo para el orchestrator
