
import { createContext, useContext, useState, useCallback, useRef } from 'react';

export const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  const nextId = useRef(1);

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

    setOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  }, []);

  const updateOrderStatus = useCallback((orderId, nextStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        String(order.id) === String(orderId)
          ? { ...order, status: nextStatus }
          : order
      )
    );
  }, []);

  const getOrderById = useCallback(
    (id) => orders.find((o) => String(o.id) === String(id)),
    [orders]
  );

  const resetOrders = useCallback(() => {
    setOrders([]);
  }, []);

  const value = { orders, addOrder, getOrderById, updateOrderStatus, resetOrders };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error('useOrders must be used inside an <OrderProvider>');
  }
  return ctx;
}
