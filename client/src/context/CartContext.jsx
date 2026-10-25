/**
 * CartContext — ServeSync Member 2
 * Global cart state for the customer ordering flow.
 * Wraps the entire app so MenuPage, CartPage, and CheckoutPage all share one source of truth.
 */

import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const CartContext = createContext(null);

/**
 * CartProvider
 * Wrap your app (or router) with this to enable cart state globally.
 */
export function CartProvider({ children }) {
  // cartItems: Array<{ id, name, description, price, image, isVeg, isPopular, quantity }>
  const [cartItems, setCartItems] = useState([]);

  /**
   * addToCart — adds an item or increments its quantity if already present.
   * Accepts the same item shape from MENU_ITEMS in mockData.js
   */
  const addToCart = useCallback((item) => {
    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  /**
   * removeFromCart — removes an item entirely regardless of quantity.
   */
  const removeFromCart = useCallback((itemId) => {
    setCartItems((prev) => prev.filter((ci) => ci.id !== itemId));
  }, []);

  /**
   * updateQuantity — increments or decrements by delta (+1 / -1).
   * Quantity is clamped to a minimum of 1; use removeFromCart to delete.
   */
  const updateQuantity = useCallback((itemId, delta) => {
    setCartItems((prev) =>
      prev.map((ci) =>
        ci.id === itemId
          ? { ...ci, quantity: Math.max(1, ci.quantity + delta) }
          : ci
      )
    );
  }, []);

  /**
   * clearCart — empties the cart (called after successful order placement).
   */
  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Derived values — recalculated only when cartItems changes
  const cartCount = useMemo(
    () => cartItems.reduce((sum, ci) => sum + ci.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, ci) => sum + ci.price * ci.quantity, 0),
    [cartItems]
  );

  // Phase 1: no tax / delivery; total === subtotal
  const total = subtotal;

  const value = {
    cartItems,
    cartCount,
    subtotal,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * useCart — convenience hook to consume CartContext.
 * Throws if used outside a CartProvider.
 */
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside a <CartProvider>');
  }
  return ctx;
}
