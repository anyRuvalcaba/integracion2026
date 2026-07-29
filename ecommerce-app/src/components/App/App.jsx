import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../../context/AuthContext";
import { CartProvider } from "../../context/CartContext";
import Loading from "../common/Loading/Loading";
import Layout from "../../layout/Layout";
import Home from "../../pages/Home";
import ProtectedRoute from "../../pages/ProtectedRoute";

// Prioridad más alta: /checkout es la ruta más pesada del proyecto (ver spec PERF-001).
const Checkout = lazy(() => import("../../pages/Checkout"));
// Prioridad alta: alcanzables desde cualquier ProductCard, no son la ruta de entrada.
const Product = lazy(() => import("../../pages/Product"));
const CategoryPage = lazy(() => import("../../pages/CategoryPage"));
// Prioridad media-alta: solo alcanzable autenticado, lógica no trivial.
const Orders = lazy(() => import("../../pages/Orders"));
// Prioridad media.
const Cart = lazy(() => import("../../pages/Cart"));
const SearchResults = lazy(() => import("../../pages/SearchResults"));
const Profile = lazy(() => import("../../pages/Profile"));
const OrderConfirmation = lazy(() => import("../../pages/OrderConfirmation"));
// Prioridad baja.
const Login = lazy(() => import("../../pages/Login"));
const WishList = lazy(() => import("../../pages/WishList"));
const Settings = lazy(() => import("../../pages/Setttings"));

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Layout>
            <Suspense fallback={<Loading>Cargando...</Loading>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/login" element={<Login />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/product/:productId" element={<Product />} />
                <Route path="/category/:categoryId" element={<CategoryPage />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute
                      redirectTo="/login"
                      allowedRoles={["admin", "customer", "cliente"]}
                    >
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout></Checkout>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wishlist"
                  element={
                    <ProtectedRoute>
                      <WishList></WishList>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute>
                      <Orders />
                    </ProtectedRoute>
                  }
                />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings></Settings>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings></Settings>
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<div>Ruta no encontrada</div>} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;