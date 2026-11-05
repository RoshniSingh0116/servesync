'use strict';

/**
 * kitchenRoutes.js — ServeSync (Member 4)
 *
 * Registers the Kitchen Dashboard API routes on an Express Router.
 * Mounted at /api/kitchen in server.js.
 *
 * Routes:
 *   GET   /api/kitchen/orders                  → getAllKitchenOrders       (all orders, newest first)
 *   GET   /api/kitchen/orders/status/:status   → getKitchenOrdersByStatus  (filter by status)
 *   GET   /api/kitchen/orders/:id              → getKitchenOrderById       (single order by ObjectId)
 *   PATCH /api/kitchen/orders/:id/status       → updateKitchenOrderStatus  (update status with transition validation)
 *
 * IMPORTANT: /orders/status/:status MUST be registered before /orders/:id.
 * Express matches routes in declaration order, so if /:id came first the
 * literal segment "status" would be captured as an ObjectId string and
 * fail validation instead of reaching the filter handler.
 */

const { Router } = require('express');
const {
  getAllKitchenOrders,
  getKitchenOrdersByStatus,
  getKitchenOrderById,
  updateKitchenOrderStatus,
} = require('../controllers/kitchenController');

const router = Router();

// GET  /api/kitchen/orders                — list all orders (newest first)
router.get('/orders', getAllKitchenOrders);

// GET  /api/kitchen/orders/status/:status — filter orders by status
// Must be declared BEFORE /orders/:id to avoid Express capturing "status"
// as an ObjectId :id parameter.
router.get('/orders/status/:status', getKitchenOrdersByStatus);

// GET  /api/kitchen/orders/:id            — single order by ObjectId
router.get('/orders/:id', getKitchenOrderById);

// PATCH /api/kitchen/orders/:id/status    — update status (with transition validation)
router.patch('/orders/:id/status', updateKitchenOrderStatus);

module.exports = router;
