# Carrito de compras

## 🎯 Objetivo

Implementar un **carrito de compras funcional** con gestión de estado global usando **Context API**. Este reto te enseñará a manejar estado compartido entre componentes y crear una experiencia de e-commerce real.

---

## 📋 Alcance del Proyecto

### 🛍️ Funcionalidades del Carrito

- **Agregar productos**: Desde ProductCard al carrito
- **Ver carrito**: Lista de productos agregados
- **Modificar cantidades**: Incrementar/decrementar productos
- **Eliminar productos**: Quitar elementos del carrito
- **Total calculado**: Suma automática del precio total

### 🔄 Gestión de Estado

- **Context API**: Estado global del carrito
- **Provider**: Envolver la aplicación
- **useContext**: Consumir el carrito desde cualquier componente

---

## ✅ Requisitos Técnicos

### 🏗️ 1. Cart Context

- [ ] Archivo `src/context/CartContext.jsx`
- [ ] CartProvider con estado del carrito
- [ ] Funciones: addToCart, removeFromCart, updateQuantity
- [ ] Hook personalizado useCart para facilitar uso

### 🛒 2. Componente Cart

- [ ] Página/componente `src/components/Cart.jsx`
- [ ] Lista de productos en el carrito
- [ ] Controles para modificar cantidad
- [ ] Botón para eliminar productos
- [ ] Total calculado y mostrado

### 🔗 3. Integración

- [ ] ProductCard actualizado para usar addToCart
- [ ] Navegación actualizada con link al carrito
- [ ] Contador de productos en header/navbar
- [ ] Persistencia opcional en localStorage

---

## 📤 Entregables

### 🚀 Archivos Requeridos

- [ ] `src/context/CartContext.jsx` - Context y Provider implementado
- [ ] `src/components/Cart.jsx` - Componente del carrito
- [ ] `src/pages/CartPage.jsx` - Página del carrito (opcional)
- [ ] Componentes actualizados que usen el carrito

### 🎯 Funcionalidad Mínima

- [ ] Agregar productos al carrito desde ProductCard
- [ ] Ver lista de productos en el carrito
- [ ] Modificar cantidades de productos
- [ ] Eliminar productos del carrito
- [ ] Calcular y mostrar total

---

## 🔍 Criterios de Revisión

### ✅ Implementación Técnica

- [ ] **Context bien estructurado**: Provider, state y actions separados
- [ ] **useContext correcto**: Hook personalizado para facilitar uso
- [ ] **Inmutabilidad**: Estado actualizado sin mutar arrays/objetos
- [ ] **Performance**: Re-renders mínimos y optimizados

### 🎨 Experiencia de Usuario

- [ ] **UI intuitiva**: Botones claros para agregar/quitar
- [ ] **Feedback visual**: Cambios inmediatos en el carrito
- [ ] **Estados vacíos**: Mensaje cuando carrito está vacío
- [ ] **Responsive**: Funciona bien en mobile y desktop

### 📱 Funcionalidad Completa

- [ ] **Datos consistentes**: Total siempre correcto
- [ ] **Edge cases**: Manejo de cantidades 0, productos duplicados
- [ ] **Navegación**: Fácil ir/volver del carrito
- [ ] **Estado persistente**: No se pierde al navegar

---

## 💡 Pistas y Guía de Implementación

### 🏗️ Paso 1: Crear Cart Context

**Pistas para el Context:**
```javascript
// ¿Qué datos necesitas en el estado del carrito?
// ¿Cómo estructurar un item del carrito?
// ¿Qué funciones necesitas para manipular el carrito?
// ¿Cómo evitar mutar el estado directamente?
```

### 🔄 Paso 2: Funciones del Carrito

**Pistas para las acciones:**
```javascript
// addToCart: ¿Cómo manejar productos duplicados?
// removeFromCart: ¿Filtrar por ID?
// updateQuantity: ¿Cómo actualizar un item específico?
// clearCart: ¿Resetear todo el estado?
```

### 🛒 Paso 3: Componente Cart

**Pistas para la UI:**
```javascript
// ¿Cómo mapear los items del carrito?
// ¿Dónde colocar botones +/- para cantidades?
// ¿Cómo calcular el total de cada producto?
// ¿Cómo sumar el total general?
```

### 🔗 Paso 4: Integración

**Pistas para conectar componentes:**
```javascript
// ¿Dónde colocar el CartProvider?
// ¿Cómo actualizar ProductCard para usar addToCart?
// ¿Dónde mostrar contador de productos?
// ¿Cómo navegar al carrito?
```

---

## 🧠 Conceptos Clave a Investigar

### 📚 Antes de Empezar, Estudia:

- **Context API**: ¿Cuándo usar Context vs props?
- **useReducer vs useState**: ¿Cuál es mejor para estado complejo?
- **Inmutabilidad**: ¿Por qué no mutar estado directamente?
- **Custom hooks**: ¿Cómo crear useCart hook?

### 🔍 Preguntas para Reflexionar:

1. ¿Por qué usar Context en lugar de prop drilling?
2. ¿Cómo evitar re-renders innecesarios con Context?
3. ¿Qué pasa si un producto ya está en el carrito?
4. ¿Cómo manejar cantidades negativas o cero?

---

## 🌟 Extra (Opcional)

Si terminas rápido, explora estos conceptos:

### 🔥 Mejoras Avanzadas

- [ ] **localStorage**: ¿Persistir carrito entre sesiones?
- [ ] **useReducer**: ¿Migrar de useState a useReducer?
- [ ] **Optimización**: ¿useMemo y useCallback para performance?

### 🎨 Mejoras de UX

- [ ] **Animaciones**: ¿Transiciones al agregar/quitar?
- [ ] **Toast notifications**: ¿Feedback al agregar productos?
- [ ] **Empty state**: ¿Ilustración cuando carrito vacío?

### 🔧 Funcionalidades Extra

- [ ] **Favoritos**: ¿Lista de deseos separada?
- [ ] **Cupones**: ¿Sistema de descuentos?
- [ ] **Checkout**: ¿Proceso de compra básico?

---

## 🚀 Testing y Validación

### ⚡ Comandos para Probar

```bash
# Iniciar el proyecto
npm start

# Verificar que no hay errores
npm run build
```

### 🔍 Lista de Verificación

1. **Agregar productos**: ¿Se añaden al carrito?
2. **Ver carrito**: ¿Se muestran correctamente?
3. **Cambiar cantidades**: ¿Botones +/- funcionan?
4. **Eliminar productos**: ¿Se quitan del carrito?
5. **Calcular total**: ¿Total siempre correcto?
6. **Navegación**: ¿Carrito persiste al navegar?

---

## 🆘 Ayuda y Recursos

### ❌ Si Te Atascas, Verifica:

- **Provider**: ¿Envuelve toda la aplicación?
- **Context value**: ¿Pasas state y functions correctamente?
- **useContext**: ¿Importas el context correcto?
- **Inmutabilidad**: ¿Usas spread operator para actualizar estado?

### 💡 Tips de Debug

- Usa React DevTools para ver el Context
- console.log el estado del carrito en cada acción
- Verifica que no hay errores en consola

### 🔗 Recursos Útiles

- [React Context API](https://react.dev/reference/react/useContext)
- [useReducer Hook](https://react.dev/reference/react/useReducer)
- [Immutable Updates](https://react.dev/learn/updating-objects-in-state)

---

## 🎯 Objetivos de Aprendizaje

Al completar este reto habrás dominado:

- ✅ **Context API**: Gestión de estado global
- ✅ **useContext**: Consumir context en componentes
- ✅ **Custom hooks**: Crear hooks reutilizables
- ✅ **Inmutabilidad**: Actualizar estado sin mutaciones
- ✅ **Estado complejo**: Manejar múltiples acciones y datos

---

<div align="center">

**⏰ Tiempo estimado:** 4-5 horas
**📚 Dificultad:** ⭐⭐⭐⭐ Intermedio-Avanzado
**🎯 Enfoque:** Context API y estado global

---

**🏫 Curso:** Inadaptados React 2025
**👨‍💻 Instructor:** Rodrigo Leaños Bermejo

</div>