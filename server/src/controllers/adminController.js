'use strict';

/**
 * adminController.js — ServeSync (Member 3)
 *
 * Express controller functions for the Admin API.
 *
 * Endpoints handled:
 *   POST  /api/admin/login       — authenticate admin, return login response
 *   GET   /api/admin/foods       — list all food items (admin view)
 *   GET   /api/admin/orders      — list all orders newest-first (admin view)
 *   GET   /api/admin/dashboard   — aggregated summary stats
 *
 * ─── Authentication approach ──────────────────────────────────────────────
 *
 * The project's installed dependencies are:
 *   cors, dotenv, express, mongodb
 *
 * bcrypt and jsonwebtoken are NOT installed.  Per the task spec:
 *   "If a required authentication dependency or password-storage approach is
 *    not already specified or installed, do not introduce one independently.
 *    Explain what is missing and ask before adding it."
 *
 * Therefore this controller performs a DIRECT STRING COMPARISON between the
 * submitted password and the stored password field in the `admins` collection.
 *
 * ⚠️  IMPORTANT — Coordination required before production:
 *   This plain-text comparison is intentionally temporary and only safe for
 *   local development where the MongoDB instance is not publicly reachable.
 *   Before this is merged or deployed, the team must:
 *     1. Run `npm install bcryptjs jsonwebtoken` in server/.
 *     2. Hash the admin password stored in the `admins` collection.
 *     3. Replace the direct comparison below with bcrypt.compare().
 *     4. Issue a JWT on success and validate it on protected routes.
 *   See the Phase 2 design document for the full implementation plan.
 *
 * ─── Design decisions ─────────────────────────────────────────────────────
 *  - getDB() is called inside each function so these handlers are only
 *    invoked after connectDB() has run — same pattern as other controllers.
 *  - Food and order data is read directly via getDB() where the existing
 *    repositories already expose the needed queries.  For the dashboard
 *    aggregation we use the MongoDB driver's countDocuments() which is
 *    efficient and avoids fetching full documents.
 *  - The `password` field is NEVER included in any response body.
 *  - Error messages do not reveal whether the username exists or not
 *    (prevents user-enumeration attacks even at this stage).
 *  - Empty collections return an empty array / zero counts — never an error.
 */

const { getDB }              = require('../config/db');
const { findAdminByUsername } = require('../repositories/adminRepository');
const { findAllFoods }        = require('../repositories/foodRepository');
const { findAllOrders }       = require('../repositories/orderRepository');

/* ─── POST /api/admin/login ───────────────────────────────────────────── */

/**
 * adminLogin — validates credentials against the `admins` collection
 * and returns a sanitised admin object on success.
 *
 * Request body: { username: string, password: string }
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
    const admin = await findAdminByUsername(String(username).trim());

    /* ── 3. Verify credentials ──────────────────────────────────────────
     *
     * NOTE: Plain-text comparison — temporary until bcryptjs is installed.
     * See the ⚠️ note at the top of this file.
     *
     * We use a single generic error message for both "not found" and
     * "wrong password" to prevent username enumeration.
     */
    if (!admin || admin.password !== String(password)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    /* ── 4. Build the safe response — strip the password ── */
    // eslint-disable-next-line no-unused-vars
    const { password: _pw, ...safeAdmin } = admin;

    return res.status(200).json({
      message: 'Login successful.',
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
    const foods = await findAllFoods(null); // null = no category filter

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
 * Returns an empty array when no orders exist.
 */
async function adminGetOrders(req, res) {
  try {
    const orders = await findAllOrders();

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
 *     totalFoods:      number,   // all items in `foods`
 *     availableFoods:  number,   // isAvailable === true
 *     unavailableFoods:number,   // isAvailable === false (or missing)
 *     totalOrders:     number,   // all orders
 *     pendingOrders:   number,   // status === 'Pending'
 *     preparingOrders: number,   // status === 'Preparing'
 *     readyOrders:     number,   // status === 'Ready'
 *     servedOrders:    number,   // status === 'Served'
 *   }
 */
async function adminGetDashboard(req, res) {
  try {
    const db = getDB();
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
      servedOrders,
    ] = await Promise.all([
      foodsCol.countDocuments({}),
      foodsCol.countDocuments({ isAvailable: true }),
      ordersCol.countDocuments({}),
      ordersCol.countDocuments({ status: 'Pending' }),
      ordersCol.countDocuments({ status: 'Preparing' }),
      ordersCol.countDocuments({ status: 'Ready' }),
      ordersCol.countDocuments({ status: 'Served' }),
    ]);

    return res.status(200).json({
      totalFoods,
      availableFoods,
      unavailableFoods: totalFoods - availableFoods,
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      servedOrders,
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
