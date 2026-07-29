import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import {
  getCartByUser,createCart, replaceCart,
  clearCart as serviceClearCart,
} from "../services/cartService";
import { readLocalJSON, writeLocalJSON } from "../utils/storageHelpers";

const CartContext = createContext();

export function CartProvider({ children }) {
  const CART_STORAGE_KEY = "cart";
  const { isAuthenticated, user } = useAuth();
  const [cartid, setCartId] = useState(null);
  const [items, setItems] = useState(() => readLocalJSON(CART_STORAGE_KEY) ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    writeLocalJSON(CART_STORAGE_KEY, items);
  }, [items]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCartId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const localItems = readLocalJSON(CART_STORAGE_KEY)?? [];
      try{
        const serverCart = await getCartByUser(user.id);
        if(cancelled) return;

        const serverItems = serverCart.products.map((entry) => ({
          product: entry.product,
          quantity: entry.quantity,
        }));

        setCartId(serverCart._id);
        changeItems(mergeCarts(localItems, serverItems));

      }catch(error){
        if(cancelled) return;
        if (error.kind !== "CART_NOT_FOUND"){
          setError(error.kind ?? "SERVER_ERROR");
        }
      }
    })();
    return () => cancelled = true;
  }, [isAuthenticated, user?.id]);

  const mergeCarts = (localItems, serverItems) => {
    const merged = serverItems.map((serverItem)=>{
      const localItem = localItems.find((item) => item.product._id === serverItem.product._id);

      if (localItem){
        return { ...serverItem, quantity: localItem.quantity };
      }
      return serverItem;
    }); 
    const onlyLocal = localItems.filter(
      (localItem) => !serverItems.find((item) => item.product._id === localItem.product._id),
    );
    return [...merged, ...onlyLocal];
  };

  const count = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity, 0),
    [items],
  );

  const total = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity * it.product.price, 0),
    [items],
  );

  const syncWithApi = useCallback(
    async (nextItems) => {
      if (!isAuthenticated) return;

      // Carrito vacio = el usuario no tiene un carrito
      if (nextItems.length === 0) {
        if (cartid) {
          await serviceClearCart(cartid);
          setCartId(null);
        }
      }

      const products = nextItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      }));

      if (!cartid) {
        const created = await createCart(user.id, products);
        setCartId(created._id);
      } else {
        await replaceCart(cartid, user.id, products);
      }
    },
    [isAuthenticated, cartid, user],
  );

  const changeItems = useCallback(
    (nextItems) => {
      setItems(nextItems);
      setError(null);
      syncWithApi(nextItems).catch((error) => {
        setError(error.kind ?? "SERVER_ERROR");
      });
    },
    [syncWithApi],
  );

  const addItem = useCallback(
    async (product, quantity = 1) => {
      const existingProduct = items.find(
        (item) => item.product._id === product._id
      );

      const nextItems = existingProduct
      ? items.map((item) =>
        item.product._id === product._id
        ? { ...item, quantity: item.quantity + quantity }
        : item)
      : [...items, { product, quantity }];

      changeItems(nextItems);
    },
    [items, changeItems],
  );

  const removeItem = useCallback(
    async (itemId) => {
      changeItems(items.filter((item) => item.product._id !== itemId));
    },
    [items, changeItems],
  );

  const updateQuantity = useCallback(
    async (itemId, quantity) => {
      if (quantity < 1) return removeItem(itemId);

      const nextItems = items.map((item) =>
        item.product._id === itemId ?{...item, quantity} : item);

      changeItems(nextItems);
    },
    [items, changeItems, removeItem],
  );

  const clearCart = useCallback(() => changeItems([]), [changeItems]);

  const value = useMemo(
    () => ({
      items,
      count,
      total,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      loading,
      error,
    }),
    [items, count, total, addItem, updateQuantity, removeItem, clearCart, loading, error],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart debe ser usado dentro de CartProvider");
  return context;
}