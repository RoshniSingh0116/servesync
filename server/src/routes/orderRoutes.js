'use strict';

/**
 * orderRoutes.js — ServeSync (Member 2)
 *
 * Registers the Order API routes on an Express Router.
 * Mounted at /api/orders in server.js.
 *
 * Routes:
 *   POST   /api/orders       → placeOrder   (customer checkout)
 *   GET    /api/orders       → getAllOrders  (kitchen dashboard + admin)
 *   GET    /api/orders/:id   → getOrderById  (order confirmation page)
 */

const { Router } = require('express');
const {
  placeOrder,
  getOrderById,
  getAllOrders,
} = require('../controllers/orderController');

const router = Router();

router.post('/', placeOrder);
router.get('/', getAllOrders);
router.get('/:id', getOrderById);

module.exports = router;
