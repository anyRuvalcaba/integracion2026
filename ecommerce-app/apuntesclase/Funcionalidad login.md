# Autenticación y Rutas Protegidas

## 🎯 Objetivo

Implementar un **sistema de autenticación simulado** para restringir rutas y mostrar contenido personalizado según el usuario. Aprenderás a manejar login/logout, proteger rutas y mostrar información del usuario en la UI.

---

## 📋 Alcance del Proyecto

### 🔒 Funcionalidades de Autenticación

- **Login simulado**: Formulario con usuarios de prueba
- **Logout**: Cierre de sesión y limpieza de datos
- **Persistencia**: Sesión guardada en localStorage
- **Mostrar usuario**: Info y avatar en el header
- **Rutas protegidas**: Acceso solo si hay sesión activa

### 🔄 Gestión de Estado

- **localStorage**: Persistencia de sesión
- **Estado React**: Actualización de UI según autenticación
- **Context API (opcional)**: Para escalar a apps más grandes

---

## ✅ Requisitos Técnicos

### 🏗️ 1. Lógica de Autenticación

- [x] Archivo `src/utils/auth.js` con funciones:
  - `iniciarSesion`, `cerrarSesion`, `estaAutenticado`, `obtenerUsuarioActual`
- [x] Usuarios de prueba hardcodeados

### 🛂 2. Rutas Protegidas

- [x] Componente `ProtectedRoute` en `src/pages/auth/ProtectedRoute.jsx`
- [x] Redirección automática a `/login` si no hay sesión

### 👤 3. UI de Usuario

- [x] Componente `UserInfo` para mostrar datos y logout
- [x] Badge visual para admin
- [x] Header adaptativo según estado de sesión

### 🔗 4. Integración

- [x] Login integrado en la navegación
- [x] Logout funcional desde cualquier parte
- [x] Redirección tras login/logout

---

## 📤 Entregables

### 🚀 Archivos Requeridos

- [x] `src/utils/auth.js` - Lógica de autenticación
- [x] `src/pages/auth/Login.jsx` - Formulario de login
- [x] `src/pages/auth/ProtectedRoute.jsx` - Rutas protegidas
- [x] `src/pages/auth/UserInfo.jsx` - Widget de usuario
- [x] `src/pages/Profile.jsx` - Página de perfil protegida

### 🎯 Funcionalidad Mínima

- [x] Login/logout funcional
- [x] Persistencia de sesión
- [x] Rutas protegidas
- [x] UI que refleja el estado de autenticación

---

## 🔍 Criterios de Revisión

### ✅ Implementación Técnica

- [x] **Funciones de auth**: Separadas y reutilizables
- [x] **Persistencia**: localStorage correctamente usado
- [x] **Rutas protegidas**: No se accede sin login
- [x] **UI reactiva**: Cambia según sesión

### 🎨 Experiencia de Usuario

- [x] **Feedback de errores**: Mensajes claros en login
- [x] **Logout visible**: Fácil de encontrar
- [x] **Responsive**: Funciona en mobile y desktop

### 📱 Funcionalidad Completa

- [x] **Redirección**: Después de login/logout
- [x] **Datos consistentes**: Usuario siempre correcto
- [x] **Edge cases**: Manejo de sesión inválida

---

## 💡 Pistas y Guía de Implementación

### 🏗️ Paso 1: Lógica de Autenticación

```js
// ¿Cómo guardar y leer el usuario en localStorage?
// ¿Cómo simular usuarios válidos?
// ¿Cómo limpiar la sesión?
```

### 🔄 Paso 2: Rutas Protegidas

```js
// ¿Cómo usar ProtectedRoute para proteger páginas?
// ¿Cómo redirigir si no hay sesión?
```

### 👤 Paso 3: UI de Usuario

```js
// ¿Cómo mostrar el nombre y rol del usuario?
// ¿Cómo mostrar el botón de logout?
// ¿Cómo actualizar la UI tras login/logout?
```

### 🔗 Paso 4: Integración

```js
// ¿Dónde colocar el login en la navegación?
// ¿Cómo actualizar el header tras login/logout?
```

---

## 🧠 Conceptos Clave a Investigar

- **localStorage**: Persistencia en el navegador
- **React Router**: Rutas y redirecciones
- **Conditional rendering**: Mostrar/ocultar según sesión
- **Custom hooks (opcional)**: Para escalar la lógica

---

## 🎯 Objetivos de Aprendizaje

Al completar este reto habrás dominado:

- ✅ Autenticación básica en React
- ✅ Persistencia de sesión con localStorage
- ✅ Rutas protegidas con React Router
- ✅ UI dinámica según estado de usuario

---

⏰ **Tiempo estimado:** 2-3 horas
📚 **Dificultad:** ⭐⭐⭐ Intermedio
🎯 **Enfoque:** Autenticación y rutas protegidas