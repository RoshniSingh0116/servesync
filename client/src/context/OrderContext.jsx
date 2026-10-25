/* eslint-disable react-refresh/only-export-components */
/**
 * OrderContext — ServeSync (Member 2 & Member 4 integration)
 * Stores placed orders in React session state.
 *
 * Pre-seeded with INITIAL_MOCK_ORDERS so the Kitchen Display System (KDS)
 * has realistic active tickets out of the box, and new customer orders
 * dynamically appear in the kitchen queue.
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { INITIAL_MOCK_ORDERS } from '../mocks/mockOrders';

export const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  // Initialize with initial mock orders so Kitchen has live data
  const [orders, setOrders] = useState(() => [...INITIAL_MOCK_ORDERS]);

  // Auto-incrementing order ID starting above the initial mock orders
  const nextId = useRef(201);

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
   * resetOrders — restores orders to initial mock orders.
   */
  const resetOrders = useCallback(() => {
    setOrders([...INITIAL_MOCK_ORDERS]);
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
