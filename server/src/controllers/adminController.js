'use strict';

/**
 * adminController.js — ServeSync (Member 3)
 *
 * Express controller functions for the Admin API.
 *
 * Endpoints handled:
 *   POST  /api/admin/login       — authenticate admin with bcrypt and JWT
 *   GET   /api/admin/foods       — list all food items (admin view)
 *   GET   /api/admin/orders      — list all orders newest-first (admin view)
 *   GET   /api/admin/dashboard   — aggregated summary stats
 */

const bcrypt          = require('bcryptjs');
const jwt             = require('jsonwebtoken');
const dbConfig        = require('../config/db');
const adminRepository = require('../repositories/adminRepository');
const foodRepository  = require('../repositories/foodRepository');
const orderRepository = require('../repositories/orderRepository');

/* ─── POST /api/admin/login ───────────────────────────────────────────── */

/**
 * adminLogin — validates credentials against the `admins` collection
 * using bcrypt.compare() and returns a signed JWT on success.
 *
 * Passwords must be hashed using bcrypt (seeded via seedAdmin.js).
 * Plain-text passwords and auto-seeded defaults are not supported.
 *
 * Request body: { username: string, password: string }
 *
 * Success 200:
 *   { message, token, admin: { _id, username, role, email, ... } }
 *   (password field is always stripped from the response)
 *
 * Error 400 — missing fields
 * Error 401 — invalid credentials (generic message, no enumeration)
 * Error 500 — database or server error
 */
async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    /* ── 1. Validate presence of both fields ── */
    if (!username || String(username).trim() === '') {
      return res.status(400).json({ error: 'username is required.' });
    }
    if (!password || String(password).trim() === '') {
      return res.status(400).json({ error: 'password is required.' });
    }

    /* ── 2. Look up the admin document ── */
    const admin = await adminRepository.findAdminByUsername(String(username).trim());

    /* ── 3. Verify credentials with bcrypt ──────────────────────────────
     *
     * bcrypt.compare() is used to verify the provided password against
     * the bcrypt hash stored in MongoDB.
     * Assigns comparison result to credentialsValid.
     */
    const credentialsValid =
      admin !== null &&
      Boolean(admin.password) &&
      (await bcrypt.compare(String(password), admin.password));

    if (!credentialsValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    /* ── 4. Generate a signed JWT session token ── */
    const jwtSecret = process.env.JWT_SECRET || 'servesync_jwt_secret_key_change_in_production';
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: admin.role || 'admin',
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    /* ── 5. Build the safe response — strip the password field ── */
    // eslint-disable-next-line no-unused-vars
    const { password: _pw, ...safeAdmin } = admin;

    return res.status(200).json({
      message: 'Login successful.',
      token,
      admin: safeAdmin,
    });
  } catch (err) {
    console.error('[adminLogin] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Login failed. Please try again.' });
  }
}

/* ─── GET /api/admin/foods ────────────────────────────────────────────── */

/**
 * adminGetFoods — returns all food items from the shared `foods` collection.
 *
 * Reuses foodRepository.findAllFoods() — does NOT create a duplicate
 * collection or query.  Results are sorted by category then name
 * (the same ordering the customer menu uses).
 */
async function adminGetFoods(req, res) {
  try {
    const foods = await foodRepository.findAllFoods(null); // null = no category filter

    return res.status(200).json({
      count: foods.length,
      foods,
    });
  } catch (err) {
    console.error('[adminGetFoods] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch food items. Please try again.' });
  }
}

/* ─── GET /api/admin/orders ───────────────────────────────────────────── */

/**
 * adminGetOrders — returns all orders from the shared `orders` collection,
 * sorted newest-first.
 *
 * Reuses orderRepository.findAllOrders() — no duplicate query logic.
 * Ensures table number, items, total, status, and timestamps are present.
 * Returns an empty array when no orders exist.
 */
async function adminGetOrders(req, res) {
  try {
    const rawOrders = await orderRepository.findAllOrders();

    const orders = rawOrders.map((order) => ({
      ...order,
      total: order.total !== undefined ? order.total : order.totalAmount,
      totalAmount: order.totalAmount !== undefined ? order.totalAmount : order.total,
    }));

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error('[adminGetOrders] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch orders. Please try again.' });
  }
}

/* ─── GET /api/admin/dashboard ────────────────────────────────────────── */

/**
 * adminGetDashboard — returns aggregated summary statistics for the
 * admin dashboard overview cards.
 *
 * Uses MongoDB countDocuments() for efficiency — avoids pulling full
 * documents into memory just to count them.
 *
 * Returns:
 *   {
 *     totalFoods:       number,   // all items in `foods`
 *     totalFoodItems:   number,   // alias for totalFoods
 *     availableFoods:   number,   // isAvailable !== false
 *     unavailableFoods: number,   // isAvailable === false
 *     totalOrders:      number,   // all orders
 *     pendingOrders:    number,   // status === 'Pending'
 *     preparingOrders:  number,   // status === 'Preparing'
 *     readyOrders:      number,   // status === 'Ready'
 *     completedOrders:  number,   // status === 'Served' / 'Completed'
 *     servedOrders:     number,   // alias for completedOrders
 *   }
 */
async function adminGetDashboard(req, res) {
  try {
    const db = dbConfig.getDB();
    const foodsCol  = db.collection('foods');
    const ordersCol = db.collection('orders');

    /* Run all counts in parallel for speed */
    const [
      totalFoods,
      availableFoods,
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
    ] = await Promise.all([
      foodsCol.countDocuments({}),
      foodsCol.countDocuments({ isAvailable: { $ne: false } }),
      ordersCol.countDocuments({}),
      ordersCol.countDocuments({ status: { $in: ['Pending', 'pending'] } }),
      ordersCol.countDocuments({ status: { $in: ['Preparing', 'preparing'] } }),
      ordersCol.countDocuments({ status: { $in: ['Ready', 'ready'] } }),
      ordersCol.countDocuments({ status: { $in: ['Served', 'served', 'Completed', 'completed'] } }),
    ]);

    return res.status(200).json({
      totalFoods,
      totalFoodItems: totalFoods,
      availableFoods,
      unavailableFoods: totalFoods - availableFoods,
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      servedOrders: completedOrders,
    });
  } catch (err) {
    console.error('[adminGetDashboard] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch dashboard data. Please try again.' });
  }
}

module.exports = {
  adminLogin,
  adminGetFoods,
  adminGetOrders,
  adminGetDashboard,
};
