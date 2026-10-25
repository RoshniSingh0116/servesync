/**
 * OrderContext — ServeSync Member 2
 * Stores placed orders in React session state.
 *
 * Order structure (compatible with Member 4's Kitchen Dashboard):
 * {
 *   id: 1001,                      // auto-incrementing integer
 *   tableNumber: "5",              // string from URL ?table=
 *   items: [
 *     { foodId, name, price, quantity }
 *   ],
 *   totalAmount: 560,              // INR
 *   status: "Pending",            // matches Member 4's status vocabulary
 *   createdAt: "2026-10-25T..."    // ISO 8601 string
 * }
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);
  // Auto-incrementing order ID starting at 1001
  const nextId = useRef(1001);

  /**
   * addOrder — creates a new order record.
   * @param {{ tableNumber, items, totalAmount }} orderData
   * @returns {Object} The created order (with assigned id, status, createdAt)
   */
  const addOrder = useCallback((orderData) => {
    const newOrder = {
      id: nextId.current++,
      tableNumber: orderData.tableNumber,
      items: orderData.items.map((ci) => ({
        foodId: ci.id,
        name: ci.name,
        price: ci.price,
        quantity: ci.quantity,
      })),
      totalAmount: orderData.totalAmount,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    setOrders((prev) => [...prev, newOrder]);
    return newOrder;
  }, []);

  /**
   * getOrderById — looks up an order by its numeric id.
   * @param {number|string} id
   * @returns {Object|undefined}
   */
  const getOrderById = useCallback(
    (id) => orders.find((o) => o.id === Number(id)),
    [orders]
  );

  const value = { orders, addOrder, getOrderById };

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
