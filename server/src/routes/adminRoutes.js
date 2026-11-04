'use strict';

/**
 * adminRoutes.js — ServeSync (Member 3)
 *
 * Registers all Admin API routes on an Express Router.
 * Mounted at /api/admin in server.js.
 *
 * Routes:
 *   POST  /api/admin/login      → adminLogin       (authenticate admin)
 *   GET   /api/admin/foods      → adminGetFoods    (all food items — admin view)
 *   GET   /api/admin/orders     → adminGetOrders   (all orders — admin view)
 *   GET   /api/admin/dashboard  → adminGetDashboard (summary statistics)
 */

const { Router } = require('express');
const {
  adminLogin,
  adminGetFoods,
  adminGetOrders,
  adminGetDashboard,
} = require('../controllers/adminController');

const router = Router();

// POST /api/admin/login — admin credential check
router.post('/login', adminLogin);

// GET /api/admin/foods — full food list for admin dashboard
router.get('/foods', adminGetFoods);

// GET /api/admin/orders — full order list newest-first
router.get('/orders', adminGetOrders);

// GET /api/admin/dashboard — aggregated summary stats
router.get('/dashboard', adminGetDashboard);

module.exports = router;
