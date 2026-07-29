# CLAUDE.md — Ecommerce Workspace

Este archivo describe el estado actual del código tal como existe. No contiene sugerencias, mejoras ni deuda técnica.

---

## Skills de referencia

Skills externos disponibles para este proyecto. Cada skill define convenciones y patrones que el agente debe seguir cuando el contexto lo indique.

### Clasificación por alcance

#### Backend — `ecommerce-api/`

| Skill | Trigger en este proyecto | Archivos que cubre |
|---|---|---|
| **Express + MongoDB** | Crear o modificar controllers, models, routes, middlewares, server.js | `src/controllers/`, `src/models/`, `src/routes/`, `src/middlewares/`, `server.js` |
| **API Best Practices** | Añadir rutas, cambiar status codes, diseñar respuestas JSON, definir validaciones | `src/routes/`, `src/controllers/` |
| **MongoDB Patterns** | Crear o modificar schemas Mongoose, añadir relaciones, escribir queries, usar `.populate()` o aggregation | `src/models/` |
| **Node.js Best Practices** | Tocar `server.js`, middleware de error, logger, variables de entorno, seguridad | `server.js`, `src/middlewares/`, `src/config/` |

#### Frontend — `ecommerce-app/`

| Skill | Trigger en este proyecto | Archivos que cubre |
|---|---|---|
| **React** | Crear o modificar componentes, hooks, contextos, páginas, routing | `src/components/`, `src/context/`, `src/pages/`, `src/utils/` |
| **Frontend Design** | Crear nuevos componentes UI, añadir estilos, estructurar layouts | `src/components/common/`, `src/layout/`, archivos `.css` |

#### Workflow — ambos proyectos

| Skill | Trigger en este proyecto | Cuándo aplica |
|---|---|---|
| **Git Workflow** | Crear commits, branches, pull requests, resolver conflictos | Cualquier cambio que vaya a git |

---

### Convenciones que estos skills añaden al proyecto

Las siguientes convenciones provienen de los skills y aplican a este proyecto **tal como está escrito**. No son sugerencias de refactor; son guías de consistencia para nuevo código.

#### Express + MongoDB → patrones ya presentes en este proyecto

- Controllers: funciones `async` con `try/catch/next(error)` — ya en uso.
- Models: `mongoose.Schema` con `{ timestamps: true }` — ya en uso.
- Auth: JWT en `Authorization: Bearer` + `jwt.verify` — ya en uso.
- Validación: arrays de `body()`/`param()` + middleware `validate` — ya en uso.

#### API Best Practices → convenciones de respuesta

Cuando se creen nuevas rutas o se modifiquen respuestas existentes, usar estos status codes:

| Situación | Status |
|---|---|
| GET / PUT / PATCH exitoso | 200 |
| POST exitoso (recurso creado) | 201 |
| DELETE exitoso sin cuerpo | 204 |
| Validación fallida (express-validator) | 422 — ya configurado en `validation.js` |
| No autenticado | 401 |
| Sin permisos (no admin) | 403 |
| Recurso no encontrado | 404 |
| Email/campo duplicado | 409 — ya implementado en `authController.js` |

Formato de error estándar del skill (referencia para nuevo código):
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Product not found with id: 123"
  }
}
```
El proyecto actual usa `{ message: "..." }` directamente — mantener ese formato en código existente; usar el formato del skill solo en rutas nuevas si se decide estandarizar.

#### MongoDB Patterns → cuándo embedded vs referenced

Este proyecto usa **child referencing** (ObjectId + populate) en:
- `Product.category` → ref `Category`
- `Cart.user`, `Cart.products[].product` → refs `User`, `Product`
- `Order.user`, `Order.address`, `Order.paymentMethod` → refs `User`, `Address`, `PaymentMethod`
- `WishList.user`, `WishList.products[]` → refs `User`, `Product`

`Category.parentCategory` es **self-referencing** (árbol de categorías).

Regla del skill aplicada: usar embedded solo cuando N < 100 y los datos siempre se acceden con el padre. No se usa embedded en este proyecto.

#### Node.js Best Practices → seguridad y entorno

Variables de entorno requeridas (ya definidas en `.env.example`):
```
PORT, MONGODB_URI, JWT_SECRET, JWT_REFRESH_TOKEN, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN
```
No hardcodear ninguna de estas en el código.

#### React → hooks y contextos

Hooks en uso en este proyecto:
- `useState`, `useEffect`, `useContext`, `useMemo` — en `CartContext.jsx`
- `useState`, `useEffect` — en `AuthContext.jsx`
- `useNavigate`, `useParams` — en páginas

Patrón de custom hook ya establecido:
```js
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
```
Todos los custom hooks del proyecto siguen este patrón: `useContext` + guard con `throw`.

#### Frontend Design → estructura de componentes

El proyecto usa atomic design parcialmente:
- **Átomos** (`src/components/common/`): `Button`, `Input`, `Icon`, `Badge`, `Loading`, `ErrorMessage`
- **Organismos** (`src/components/`): `LoginForm`, `RegisterForm`, `CartView`, `ProductCard`, `ProductDetails`
- **Páginas** (`src/pages/`): `Home`, `Login`, `Cart`, `Checkout`, `Orders`, etc.
- **Layout** (`src/layout/`): `Header`, `Footer`, `Navigation`, `Breadcrumb`, `Newsletter`

Cada componente vive en su propia carpeta con su `.jsx` y su `.css`. Los componentes en `common/` exponen un `index.js` de barrel export.

#### Git Workflow → conventional commits

Usar para todos los commits en este repo:
```
feat(cart): descripción corta
fix(auth): descripción corta
refactor(checkout): descripción corta
```
Scopes válidos derivados de la estructura del proyecto: `auth`, `cart`, `order`, `product`, `category`, `wishlist`, `user`, `payment`, `address`, `checkout`, `profile`, `layout`, `context`, `services`, `test`, `seed`.

---

## Reglas para el agente

- Basar todo cambio en el código real de este repositorio.
- No agregar comentarios que expliquen "qué" hace el código; solo el "por qué" cuando no es obvio.
- No crear archivos de documentación adicionales a menos que se pida explícitamente.
- No introducir abstracciones, refactors ni manejo de errores más allá de lo que la tarea requiere.
- No agregar validaciones para escenarios que no existen en el código actual.
- El backend usa ESM (`"type": "module"`); todos los imports deben usar extensión `.js`.
- El frontend usa Create React App con React 19 y react-router-dom v7.

---

## Estructura de directorios — solo `src/`

### `ecommerce-api/src/`

```
src/
├── config/
│   └── db.conf.js              — connectDB() con mongoose.connect()
├── controllers/
│   ├── addressController.js    — getUserAddresses, getAddressById, createAddress, updateAddress, deleteAddress
│   ├── authController.js       — register, login
│   ├── cartController.js       — getCarts, getCartById, getCartByUser, createCart, updateCart, deleteCart, addProductToCart (exportada pero no montada en ninguna ruta — ver docs/backlog.md TEST-006)
│   ├── categoryController.js   — getCategories, getCategoryById, createCategory, updateCategory, deleteCategory, getProductsByCategoryAndChildren
│   ├── orderController.js      — getOrders, getOrderById, createOrder, updateOrderStatus
│   ├── paymentMethodController.js — getPaymentMethods, getPaymentMethodById, createPaymentMethod, updatePaymentMethod, deletePaymentMethod
│   ├── productController.js    — searchProducts, getProducts, getProductById, createProduct, updateProduct, deleteProduct
│   ├── userController.js       — getUsers, getUserById, createUser, updateUser, deleteUser
│   └── wishlistController.js   — getWishlists, getWishlistByUser, addProductToWishlist, removeProductFromWishlist, deleteWishlist
├── middlewares/
│   ├── authMiddleware.js       — verifica JWT en Authorization header
│   ├── errorHandler.js         — escribe en logs/error.log y responde 500
│   ├── isAdminMiddleware.js    — verifica req.user.role === "admin"
│   ├── logger.js               — imprime método y URL a consola
│   └── validation.js           — ejecuta validationResult y responde 422
├── models/
│   ├── Address.js
│   ├── Cart.js
│   ├── Category.js
│   ├── Order.js
│   ├── PaymentMethod.js
│   ├── Product.js
│   ├── User.js
│   └── WhishList.js
├── routes/
│   ├── addressRoutes.js
│   ├── authRoutes.js
│   ├── cartRoutes.js
│   ├── categoryRoutes.js
│   ├── index.js                — router raíz montado en /api
│   ├── orderRoutes.js
│   ├── paymentMethodRoutes.js
│   ├── productRoutes.js
│   ├── userRoutes.js
│   └── wishlistRoutes.js
└── seed/
    ├── productsCategories.js
    └── seed.js                 — seed idempotente: 1 admin + 2 customers + categories + products + addresses + payment methods
```

### `ecommerce-app/src/`

```
src/
├── components/
│   ├── App/
│   │   ├── App.jsx             — BrowserRouter + Routes + CartProvider
│   │   └── index.js
│   ├── BannerCarousel/
│   │   ├── BannerCarousel.jsx
│   │   ├── BannerCarousel.css
│   │   └── index.js
│   ├── Cart/
│   │   ├── CartView.jsx
│   │   └── CartView.css
│   ├── CategoryProducts/
│   │   ├── CategoryProducts.jsx
│   │   └── CategoryProducts.css
│   ├── Checkout/
│   │   ├── Address/
│   │   │   ├── AddressForm.jsx / .css
│   │   │   ├── AddressItem.jsx / .css
│   │   │   └── AddressList.jsx / .css
│   │   ├── Payment/
│   │   │   ├── PaymentForm.jsx / .css
│   │   │   ├── PaymentItem.jsx / .css
│   │   │   └── PaymentList.jsx / .css
│   │   └── shared/
│   │       ├── SummarySection.jsx
│   │       └── SummarySection.css
│   ├── List/
│   │   ├── List.jsx
│   │   └── List.css
│   ├── LoginForm/
│   │   ├── LoginForm.jsx
│   │   └── LoginForm.css
│   ├── ProductCard/
│   │   ├── ProductCard.jsx
│   │   ├── ProductCard.css
│   │   └── index.js
│   ├── ProductDetails/
│   │   ├── ProductDetails.jsx
│   │   └── ProductDetails.css
│   ├── ProfileCard/
│   │   ├── ProfileCard.jsx
│   │   └── ProfileCard.css
│   ├── RegisterErrorMessage/
│   │   └── RegisterErrorMessage.jsx
│   ├── RegisterForm/
│   │   ├── RegisterForm.jsx
│   │   └── RegisterForm.css
│   ├── SearchResultsList/
│   │   ├── SearchResultsList.jsx
│   │   └── SearchResultsList.css
│   └── common/
│       ├── Badge/     — Badge.jsx, Badge.css, index.js
│       ├── Button/    — Button.jsx, Button.css, index.js
│       ├── ErrorMessage/ — ErrorMessage.jsx, ErrorMessage.css
│       ├── Icon/      — Icon.jsx, Icon.css, index.js
│       ├── Input/     — Input.jsx, Input.css, index.js
│       └── Loading/   — Loading.jsx, Loading.css
├── context/
│   ├── AuthContext.jsx          — AuthProvider, useAuth
│   ├── CartContext.jsx          — CartProvider, useCart
│   └── ThemeContext.jsx
├── data/                        — JSON estático (no llama a la API)
│   ├── categories.json
│   ├── homeImages.json
│   ├── paymentMethods.json
│   ├── shipping-address.json
│   └── users.json
├── layout/
│   ├── Breadcrumb/  — Breadcrumb.jsx / .css
│   ├── Footer/      — Footer.jsx / .css
│   ├── Header/      — Header.jsx / .css
│   ├── Navigation/  — Navigation.jsx / .css
│   ├── Newsletter/  — Newsletter.jsx / .css
│   ├── Layout.jsx
│   └── Layout.css
├── pages/
│   ├── Cart.jsx / .css
│   ├── CategoryPage.jsx
│   ├── Checkout.jsx / .css
│   ├── Home.jsx
│   ├── Login.jsx / .css
│   ├── OrderConfirmation.jsx / .css
│   ├── Orders.jsx / .css
│   ├── Product.jsx
│   ├── ProductDetails.jsx
│   ├── Profile.jsx / .css
│   ├── ProtectedRoute.jsx
│   ├── PurchaseOrder.jsx
│   ├── Register.jsx
│   ├── SearchResults.jsx
│   ├── Setttings.jsx             — nombre de archivo con triple t
│   └── WishList.jsx
├── services/
│   ├── apiClient.js              — axios instance, baseURL: http://localhost:4000/api
│   ├── authService.js            — llama a la API
│   ├── cartService.js            — llama a la API
│   ├── categoryService.js        — llama a la API
│   ├── paymentService.js         — lee data/paymentMethods.json (local)
│   ├── productsService.js        — llama a la API
│   ├── shippingService.js        — lee data/shipping-address.json (local)
│   └── userService.js            — lee data/users.json (local)
├── styles/
│   └── .gitkeep
├── utils/
│   ├── auth.js                   — saveToken, getToken, clearToken, decodeToken, isTokenExpired
│   └── storageHelpers.js         — readLocalJSON, writeLocalJSON, normalizeAddress, normalizePayment, STORAGE_KEYS
├── index.css
├── index.js
├── logo.svg
├── reportWebVitals.js
└── setupTests.js
```

---

## Mapa de rutas API

Todas las rutas tienen el prefijo `/api` (montado en `server.js`).

Leyenda de columna Auth: `—` = pública | `auth` = requiere JWT válido | `admin` = requiere JWT + role admin.

### Auth — `/api/auth`

| Método | Path | Auth | Controller |
|--------|------|------|------------|
| POST | `/auth/register` | — | `register` |
| POST | `/auth/login` | — | `login` |

### Products — `/api`

| Método | Path | Auth | Controller |
|--------|------|------|------------|
| GET | `/products` | — | `getProducts` |
| GET | `/products/search` | — | `searchProducts` |
| GET | `/products/:id` | — | `getProductById` |
| POST | `/products` | admin | `createProduct` |
| PUT | `/products/:id` | admin | `updateProduct` |
| DELETE | `/products/:id` | admin | `deleteProduct` |

### Categories — `/api`

| Método | Path | Auth | Controller |
|--------|------|------|------------|
| GET | `/categories` | — | `getCategories` |
| GET | `/categories/:id` | — | `getCategoryById` |
| GET | `/categories/:id/products` | — | `getProductsByCategoryAndChildren` |
| POST | `/categories` | admin | `createCategory` |
| PUT | `/categories/:id` | admin | `updateCategory` |
| DELETE | `/categories/:id` | admin | `deleteCategory` |

### Cart — `/api`

| Método | Path | Auth | Controller |
|--------|------|------|------------|
| GET | `/cart` | admin | `getCarts` |
| GET | `/cart/:id` | admin | `getCartById` |
| GET | `/cart/user/:id` | auth | `getCartByUser` |
| POST | `/cart` | auth | `createCart` |
| PUT | `/cart/:id` | auth | `updateCart` |
| DELETE | `/cart/:id` | auth | `deleteCart` |

### Orders — `/api`

| Método | Path | Auth | Controller |
|--------|------|------|------------|
| GET | `/orders` | admin | `getOrders` |
| GET | `/orders/:id` | auth | `getOrderById` |
| POST | `/orders` | auth | `createOrder` |
| PUT | `/orders/:id` | auth | `updateOrderStatus` |

### Payment Methods — `/api`

| Método | Path | Auth | Controller |
|--------|------|------|------------|
| GET | `/payment-methods` | admin | `getPaymentMethods` |
| GET | `/payment-methods/me` | auth | `getUserPaymentMethods` |
| GET | `/payment-methods/:id` | admin | `getPaymentMethodById` |
| POST | `/payment-methods` | auth | `createPaymentMethod` |
| PUT | `/payment-methods/:id` | auth | `updatePaymentMethod` |
| DELETE | `/payment-methods/:id` | auth | `deletePaymentMethod` |

### Users — `/api`

| Método | Path | Auth | Controller |
|--------|------|------|------------|
| GET | `/users` | admin | `getUsers` |
| GET | `/users/:id` | admin | `getUserById` |
| POST | `/users` | admin | `createUser` |
| PUT | `/users/:id` | admin | `updateUser` |
| DELETE | `/users/:id` | admin | `deleteUser` |

### Wishlist — `/api`

| Método | Path | Auth | Controller |
|--------|------|------|------------|
| GET | `/wishlist` | admin | `getWishlists` |
| GET | `/wishlist/user/:id` | auth | `getWishlistByUser` |
| POST | `/wishlist` | auth | `addProductToWishlist` |
| DELETE | `/wishlist/:id/product` | auth | `removeProductFromWishlist` |
| DELETE | `/wishlist/:id` | auth | `deleteWishlist` |

### Addresses — `/api`

| Método | Path | Auth | Controller |
|--------|------|------|------------|
| GET | `/addresses` | auth | `getUserAddresses` |
| GET | `/addresses/:addressId` | auth | `getAddressById` |
| POST | `/addresses` | auth | `createAddress` |
| PUT | `/addresses/:addressId` | auth | `updateAddress` |
| DELETE | `/addresses/:addressId` | auth | `deleteAddress` |

> Todas las rutas de address son user-scoped: cada función filtra por `req.user.userId`, por lo que un usuario solo puede ver y modificar sus propias direcciones.

---

## Modelos Mongoose

Todos los modelos usan `{ timestamps: true }`.

### User
```js
{
  name:     String  required trim
  email:    String  required unique trim lowercase
  password: String  required
  role:     String  enum["customer","admin"]  default:"customer"
}
```

### Product
```js
{
  name:        String  required trim
  description: String
  price:       Number  required
  stock:       Number  default:0
  imageURL:    String  default:"https://placehold.co/600x400"
  category:    ObjectId  ref:"Category"
}
```

### Category
```js
{
  name:           String  required trim
  description:    String  required
  imageURL:       String  required  default:"https://placehold.co/800x600.png"
  parentCategory: ObjectId  ref:"Category"  default:null
}
```

### Cart
```js
{
  user:     ObjectId  ref:"User"  required
  products: [{
    product:  ObjectId  ref:"Product"  required
    quantity: Number    required  min:1
  }]
}
```

### Order
```js
{
  user:          ObjectId  ref:"User"     required
  products: [{
    productId:   ObjectId  ref:"Product"  required
    quantity:    Number    required  min:1
    price:       Number    required
  }]
  address:       ObjectId  ref:"Address"       required
  paymentMethod: ObjectId  ref:"PaymentMethod" required
  shippingCost:  Number    required  default:0
  totalPrice:    Number    required
  status:        String    enum["pending","processing","shipped","delivered","cancelled"]  default:"pending"
  paymentStatus: String    enum["pending","paid","failed","refunded"]  default:"pending"
}
```

### Address
```js
{
  user:        ObjectId  ref:"User"  required
  address:     String    required trim
  city:        String    required trim
  state:       String    required trim
  postalCode:  String    required  min:4  max:6  trim
  country:     String    required trim
  phone:       String    required  max:10  trim
  isDefault:   Boolean   default:false
  addressType: String    enum["home","work","other"]  default:"home"
}
```

### PaymentMethod
```js
{
  user:           ObjectId  ref:"User"  required
  type:           String    required  enum["credit_card","debit_card","paypal","bank_transfer","cash_on_delivery"]
  cardNumber:     String    max:16
  cardHolderName: String    trim
  expiryDate:     String
  paypalEmail:    String
  bankName:       String
  accountNumber:  String
  isDefault:      Boolean   default:false
  isActive:       Boolean   default:true
  cvv:            String
}
```

### WishList
```js
{
  user:     ObjectId  ref:"User"  required
  products: [ObjectId  ref:"Product"  required]
}
```

---

## Validadores por archivo de rutas

Los validadores son arrays de `body()` / `param()` de `express-validator`. Se pasan a la ruta antes de `validate` (middleware que ejecuta `validationResult` y responde 422 si hay errores).

### `authRoutes.js`
Sin validadores declarados (validación implícita en el controller).

### `productRoutes.js`
- `productIdValidation` — `param("id").isMongoId()`
- `createProductValidation` — `body("name").notEmpty()`, `body("price").notEmpty().isFloat({min:0})`, `body("category").optional().isMongoId()`
- `updateProductValidation` — `param("id").isMongoId()`, `body("name").optional().notEmpty()`, `body("price").optional().isFloat({min:0})`, `body("stock").optional().isInt({min:0})`, `body("category").optional().isMongoId()`

### `categoryRoutes.js`
- `categoryIdValidation` — `param("id").isMongoId()`
- `createCategoryValidation` — `body("name").notEmpty()`, `body("description").notEmpty()`, `body("parentCategory").optional().isMongoId()`
- `updateCategoryValidation` — `param("id").isMongoId()`, `body("name").optional().notEmpty()`, `body("description").optional().notEmpty()`, `body("parentCategory").optional().isMongoId()`

### `cartRoutes.js`
- `cartIdValidation` — `param("id").isMongoId()`
- `userIdValidation` — `param("id").isMongoId()`
- `createCartValidation` — `body("user").notEmpty().isMongoId()`, `body("products").optional().isArray()`, `body("products.*.product").isMongoId()`, `body("products.*.quantity").isInt({min:1})`
- `putCartValidation` — `param("id").isMongoId()`, `body("user").notEmpty().isMongoId()`, `body("products").notEmpty().isArray()`, `body("products.*.product").notEmpty().isMongoId()`, `body("products.*.quantity").notEmpty().isInt({min:1})`

### `orderRoutes.js`
- `orderIdValidation` — `param("id").isMongoId()`
- `createOrderValidation` — `body("user")`, `body("products").notEmpty().isArray()`, `body("products.*.productId").notEmpty().isMongoId()`, `body("products.*.quantity").notEmpty().isInt({min:1})`, `body("products.*.price").notEmpty().isFloat({min:0})`, `body("address").notEmpty().isMongoId()`, `body("paymentMethod").notEmpty().isMongoId()`, `body("totalPrice").notEmpty().isFloat({min:0})`, `body("shippingCost").optional().isFloat({min:0})`
- `updateOrderStatusValidation` — `param("id").isMongoId()`, `body("status").optional().isIn([...])`, `body("paymentStatus").optional().isIn([...])`

### `paymentMethodRoutes.js`
- `paymentIdValidation` — `param("id").isMongoId()`
- `createPaymentValidation` — `body("user").notEmpty().isMongoId()`, `body("type").notEmpty().isIn([...])`, `body("isDefault").optional().isBoolean()`
- `updatePaymentValidation` — `param("id").isMongoId()`, `body("type").optional().isIn([...])`, `body("isDefault").optional().isBoolean()`, `body("cardNumber").optional().isLength({max:16})`

### `userRoutes.js`
- `userIdValidation` — `param("id").isMongoId()`
- `createUserValidation` — `body("name").notEmpty()`, `body("email").isEmail()`, `body("password").isLength({min:6})`, `body("role").optional().isIn(["customer","admin"])`
- `updateUserValidation` — `body("email").optional().isEmail()`, `body("role").optional().isIn(["customer","admin"])`

### `wishlistRoutes.js`
- `wishlistIdValidation` — `param("id").isMongoId()`
- `userIdValidation` — `param("id").isMongoId()`
- `addProductValidation` — `body("userId").isMongoId()`, `body("productId").isMongoId()`
- `removeProductValidation` — `param("id").isMongoId()`, `body("productId").isMongoId()`

---

## Patrones de código exactos

### Patrón de controller (backend)

```js
const actionName = async (req, res, next) => {
  try {
    // lógica con Mongoose
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export { actionName };
```

### Patrón de ruta con middlewares completos (backend)

```js
router.method(
  "/path/:id",
  authMiddleware,         // si requiere auth
  isAdmin,               // si requiere admin
  validationArray,       // array de body()/param()
  validate,              // ejecuta validationResult → 422
  controllerFunction,
);
```

### Patrón de modelo Mongoose (backend)

```js
import mongoose from "mongoose";

const entitySchema = new mongoose.Schema(
  {
    field: { type: Type, required: true, ... },
    ref:   { type: mongoose.Schema.Types.ObjectId, ref: "ModelName" },
  },
  { timestamps: true },
);

const Entity = mongoose.model("Entity", entitySchema);
export default Entity;
```

### Patrón de servicio que llama a la API (frontend)

```js
import apiClient from "./apiClient";

const actionName = async (param) => {
  const response = await apiClient.method("/endpoint/" + param);
  return response.data;
};

export { actionName };
```

### Patrón de servicio con datos locales (frontend)

```js
import data from "../data/file.json";

export function getItems() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data || []);
    }, 600);
  });
}
```

### Patrón de contexto React (frontend)

```js
import { createContext, useContext, useState, useEffect } from "react";

const EntityContext = createContext(null);

export function EntityProvider({ children }) {
  const [state, setState] = useState(initialValue);

  // lógica del contexto

  const value = { state, action };
  return <EntityContext.Provider value={value}>{children}</EntityContext.Provider>;
}

export function useEntity() {
  const ctx = useContext(EntityContext);
  if (!ctx) throw new Error("useEntity debe usarse dentro de <EntityProvider>");
  return ctx;
}
```

### JWT — payload y almacenamiento (frontend)

Token almacenado en `localStorage` con clave `"authToken"`.

Payload del token (decodificado sin verificar firma):
```js
{ userId, name, role, iat, exp }
```

Helpers en `src/utils/auth.js`: `saveToken`, `getToken`, `clearToken`, `decodeToken`, `isTokenExpired`.

### apiClient (frontend)

```js
// baseURL: http://localhost:4000/api
// Interceptor de request: adjunta Authorization: Bearer <token> desde localStorage
// Interceptor de response: clasifica errores en { kind, status, original }
// Kinds: NOT_FOUND | UNAUTHORIZED | FORBIDDEN | VALIDATION | SERVER_ERROR | CLIENT_ERROR | TIMEOUT | NETWORK | UNKNOWN
```

### Clasificación de errores (frontend)

`classifyError(error)` en `apiClient.js` devuelve objetos con la forma:
```js
{ kind: "NOT_FOUND", status: 404, original: error }
{ kind: "VALIDATION", status: 422, fields: error.response.data?.errors, original: error }
```

### Middleware de error (backend)

`errorHandler` es un middleware de 4 parámetros `(err, req, res, next)`. Escribe en `logs/error.log` (ruta relativa a la raíz del proyecto). Responde `500` con `{ status: "error", message: "Internal Server Error" }`.

### Middleware de auth (backend)

Lee el token de `Authorization: Bearer <token>`. Decodifica con `jwt.verify` usando `process.env.JWT_SECRET`. Coloca el payload en `req.user`. El payload incluye `{ userId, name, role }`.

---

## Variables de entorno — `ecommerce-api`

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/ecommerce-db-test
JWT_SECRET=secret_token
JWT_REFRESH_TOKEN=secret_refresh_token
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

## Scripts npm

### `ecommerce-api`
```
npm run dev          → nodemon server.js
npm run start        → node server.js
npm run seedProducts → node ./src/seed/productsCategories.js
```

### `ecommerce-app`
```
npm start   → react-scripts start
npm build   → react-scripts build
npm test    → react-scripts test
```

---

## Harness de agentes y política de modelos

- Política de selección de modelo por agente: `.claude/model-policy.md` (ver también `docs/adrs/ADR-1-politica-de-modelos.md`).
- Roster de subagentes invocables: `.claude/agents/` (17 agentes; ver tabla en `model-policy.md` §4).
- Gobierno del comportamiento del main loop (orquestación, nunca implementación directa): `.agents/orchestrator.md`.
- Protocolo operativo completo: `/SSDLC.md` (fuente canónica, v2.0.0). `.agents/workflows/ssdlc.md` es solo índice de referencia rápida.
