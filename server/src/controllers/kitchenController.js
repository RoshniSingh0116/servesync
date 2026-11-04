'use strict';

/**
 * kitchenController.js — ServeSync (Member 4)
 *
 * Express controller functions for the Kitchen Dashboard API.
 *
 * Status lifecycle (mirrors Member 2's Order.js ORDER_STATUSES):
 *   Pending → Preparing → Ready → Served
 *
 * The task spec also mentions lowercase variants (pending / preparing /
 * ready / completed).  This controller accepts BOTH casings and normalises
 * them to Title-case to stay consistent with Member 2's existing documents.
 * "completed" is mapped to "Served" because that is Member 2's terminal
 * status value already stored in MongoDB.
 *
 * Valid status inputs (case-insensitive):
 *   pending | preparing | ready | served | completed
 */

const { ObjectId } = require('mongodb');
const {
  findAllKitchenOrders,
  findKitchenOrderById,
  updateOrderStatus,
} = require('../repositories/kitchenRepository');

/* ─── Constants ──────────────────────────────────────────────────────────── */

/**
 * Canonical Title-case statuses that Member 2 persists in MongoDB.
 * Member 4 always writes one of these values so both members stay in sync.
 */
const VALID_STATUSES = ['Pending', 'Preparing', 'Ready', 'Served'];

/**
 * Map of accepted input strings (lowercased) → canonical stored value.
 * Accepts both the task spec's lowercase words and the existing Title-case ones.
 * "completed" is treated as an alias for "Served".
 */
const STATUS_MAP = {
  pending: 'Pending',
  preparing: 'Preparing',
  ready: 'Ready',
  served: 'Served',
  completed: 'Served',   // task-spec alias → canonical value
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/**
 * Returns true if the given string is a valid 24-hex-char MongoDB ObjectId.
 * @param {string} id
 */
function isValidObjectId(id) {
  return (
    typeof id === 'string' &&
    ObjectId.isValid(id) &&
    String(new ObjectId(id)) === id
  );
}

/* ─── GET /api/kitchen/orders ────────────────────────────────────────────── */

/**
 * getAllKitchenOrders — returns every order in the `orders` collection,
 * newest first.  Responds with an empty array when no orders exist.
 */
async function getAllKitchenOrders(req, res) {
  try {
    const orders = await findAllKitchenOrders();

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error('[getAllKitchenOrders] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch kitchen orders. Please try again.' });
  }
}

/* ─── GET /api/kitchen/orders/:id ───────────────────────────────────────── */

/**
 * getKitchenOrderById — fetches a single order by its MongoDB ObjectId.
 */
async function getKitchenOrderById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format.' });
    }

    const order = await findKitchenOrderById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    return res.status(200).json({ order });
  } catch (err) {
    console.error('[getKitchenOrderById] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch order. Please try again.' });
  }
}

/* ─── PATCH /api/kitchen/orders/:id/status ──────────────────────────────── */

/**
 * updateKitchenOrderStatus — validates the incoming status, looks up the
 * order, writes the new status to MongoDB, and returns the updated document.
 */
async function updateKitchenOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    /* ── 1. Validate order ID ── */
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format.' });
    }

    /* ── 2. Validate status presence ── */
    if (status === undefined || status === null || String(status).trim() === '') {
      return res.status(400).json({
        error: 'status is required in the request body.',
        validStatuses: ['pending', 'preparing', 'ready', 'served', 'completed'],
      });
    }

    /* ── 3. Normalise and validate status value ── */
    const normalised = STATUS_MAP[String(status).toLowerCase().trim()];

    if (!normalised) {
      return res.status(400).json({
        error: `"${status}" is not a valid order status.`,
        validStatuses: ['pending', 'preparing', 'ready', 'served', 'completed'],
      });
    }

    /* ── 4. Check the order exists, then update ── */
    const updated = await updateOrderStatus(id, normalised);

    if (!updated) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    return res.status(200).json({
      message: `Order status updated to "${normalised}".`,
      order: updated,
    });
  } catch (err) {
    console.error('[updateKitchenOrderStatus] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to update order status. Please try again.' });
  }
}

module.exports = {
  getAllKitchenOrders,
  getKitchenOrderById,
  updateKitchenOrderStatus,
};
