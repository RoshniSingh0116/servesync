'use strict';

/**
 * orderRoutes.js — ServeSync (Member 2)
 *
 * Registers the Order API routes on an Express Router.
 * Mounted at /api/orders in server.js.
 *
 * Routes:
 *   POST   /api/orders                     → placeOrder         (customer checkout)
 *   GET    /api/orders                     → getAllOrders        (kitchen dashboard + admin)
 *   GET    /api/orders/table/:tableNumber  → getOrdersByTable   (table-specific orders)
 *   GET    /api/orders/:id                 → getOrderById       (order confirmation page)
 *
 * IMPORTANT: /table/:tableNumber must be registered BEFORE /:id so Express
 * does not misinterpret the literal string "table" as an order ObjectId.
 */

const { Router } = require('express');
const {
  placeOrder,
  getOrderById,
  getAllOrders,
  getOrdersByTable,
} = require('../controllers/orderController');

const router = Router();

router.post('/', placeOrder);
router.get('/', getAllOrders);
router.get('/table/:tableNumber', getOrdersByTable);  // specific before generic
router.get('/:id', getOrderById);

module.exports = router;
