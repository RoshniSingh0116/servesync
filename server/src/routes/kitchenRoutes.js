'use strict';

/**
 * kitchenRoutes.js — ServeSync (Member 4)
 *
 * Registers the Kitchen Dashboard API routes on an Express Router.
 * Mounted at /api/kitchen in server.js.
 *
 * Routes:
 *   GET   /api/kitchen/orders          → getAllKitchenOrders   (kitchen dashboard list)
 *   GET   /api/kitchen/orders/:id      → getKitchenOrderById   (single order detail)
 *   PATCH /api/kitchen/orders/:id/status → updateKitchenOrderStatus (status update)
 */

const { Router } = require('express');
const {
  getAllKitchenOrders,
  getKitchenOrderById,
  updateKitchenOrderStatus,
} = require('../controllers/kitchenController');

const router = Router();

// GET  /api/kitchen/orders          — list all orders (newest first)
router.get('/orders', getAllKitchenOrders);

// GET  /api/kitchen/orders/:id      — single order by ObjectId
router.get('/orders/:id', getKitchenOrderById);

// PATCH /api/kitchen/orders/:id/status — update status of one order
router.patch('/orders/:id/status', updateKitchenOrderStatus);

module.exports = router;
