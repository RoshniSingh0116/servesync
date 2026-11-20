/* eslint-disable react-refresh/only-export-components */
/**
 * OrderContext — ServeSync (Member 2 & Member 4 integration)
 * In-session cache for orders placed in the current browser session.
 * Used by CheckoutPage → OrderConfirmationPage for same-session display
 * without requiring an extra API round-trip.
 *
 * The Kitchen Dashboard (KitchenDashboardPage) fetches directly from
 * GET /api/kitchen/orders and does NOT use this context.
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react';

export const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  // Starts empty — no mock data. Orders are added when real orders are placed.
  const [orders, setOrders] = useState([]);

  // Auto-incrementing session id for in-session order lookup
  const nextId = useRef(1);

  /**
   * addOrder — creates a new order record from checkout.
   * @param {{ tableNumber, items, totalAmount, specialInstructions }} orderData
   * @returns {Object} The created order
   */
  const addOrder = useCallback((orderData) => {
    const assignedId = nextId.current++;
    const newOrder = {
      id: assignedId,
      tableNumber: orderData.tableNumber,
      items: orderData.items.map((ci) => ({
        foodId: ci.id,
        name: ci.name,
        price: ci.price,
        quantity: ci.quantity,
      })),
      totalAmount: orderData.totalAmount,
      total: orderData.totalAmount,
      status: 'Pending',
      createdAt: new Date().toISOString(),
      specialInstructions: orderData.specialInstructions || null,
    };

    // Prepend to orders so the newest order appears first in kitchen queue
    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }, []);

  /**
   * updateOrderStatus — transitions an order's status (Pending → Preparing → Ready → Served)
   * @param {number|string} orderId
   * @param {string} nextStatus
   */
  const updateOrderStatus = useCallback((orderId, nextStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        String(order.id) === String(orderId)
          ? { ...order, status: nextStatus }
          : order
      )
    );
  }, []);

  /**
   * getOrderById — looks up an order by its numeric or string id.
   * @param {number|string} id
   * @returns {Object|undefined}
   */
  const getOrderById = useCallback(
    (id) => orders.find((o) => String(o.id) === String(id)),
    [orders]
  );

  /**
   * resetOrders — clears all in-session orders (e.g. for testing or cleanup).
   */
  const resetOrders = useCallback(() => {
    setOrders([]);
  }, []);

  const value = { orders, addOrder, getOrderById, updateOrderStatus, resetOrders };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

/**
 * useOrders — convenience hook to consume OrderContext.
 */
export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error('useOrders must be used inside an <OrderProvider>');
  }
  return ctx;
}
