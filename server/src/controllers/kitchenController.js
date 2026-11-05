'use strict';

/**
 * kitchenController.js — ServeSync (Member 4)
 *
 * Express controller functions for the Kitchen Dashboard API.
 *
 * Status lifecycle (mirrors Member 2's Order.js ORDER_STATUSES):
 *   Pending → Preparing → Ready → Served
 *
 * This controller accepts both the task-spec lowercase words and the
 * existing Title-case values, normalising everything to Title-case before
 * writing to MongoDB (so Member 2's documents stay consistent).
 *
 * "completed" is treated as an alias for "Served" (Member 2's terminal status).
 *
 * Valid status inputs (case-insensitive):
 *   pending | preparing | ready | served | completed
 */

const { ObjectId } = require('mongodb');
const {
  findAllKitchenOrders,
  findOrdersByStatus,
  findKitchenOrderById,
  updateOrderStatus,
} = require('../repositories/kitchenRepository');

/* ─── Constants ──────────────────────────────────────────────────────────── */

/**
 * Canonical Title-case statuses that Member 2 persists in MongoDB.
 * Order matters — it defines the ONLY valid forward progression.
 *
 *   index 0 → Pending
 *   index 1 → Preparing
 *   index 2 → Ready
 *   index 3 → Served
 *
 * A transition is valid only if the new status has a higher index than the
 * current one (no skipping, no going backwards).
 */
const STATUS_LIFECYCLE = ['Pending', 'Preparing', 'Ready', 'Served'];

/**
 * Map of accepted input strings (lowercased) → canonical stored value.
 * Accepts both the task spec's lowercase words and existing Title-case ones.
 * "completed" is treated as an alias for "Served".
 */
const STATUS_MAP = {
  pending:   'Pending',
  preparing: 'Preparing',
  ready:     'Ready',
  served:    'Served',
  completed: 'Served',  // task-spec alias → canonical value
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

/**
 * isValidTransition — returns true when moving from `currentStatus` to
 * `newStatus` follows the strict forward-only lifecycle.
 *
 * Rules:
 *  - newStatus must appear AFTER currentStatus in STATUS_LIFECYCLE.
 *  - Transitions must be to the IMMEDIATE next step (no skipping).
 *  - Backwards moves are rejected.
 *  - Re-applying the same status is rejected.
 *
 * @param {string} currentStatus  Title-case status currently stored in MongoDB.
 * @param {string} newStatus      Title-case status being requested.
 * @returns {boolean}
 */
function isValidTransition(currentStatus, newStatus) {
  const currentIdx = STATUS_LIFECYCLE.indexOf(currentStatus);
  const newIdx     = STATUS_LIFECYCLE.indexOf(newStatus);

  // Both statuses must be in the lifecycle array
  if (currentIdx === -1 || newIdx === -1) return false;

  // Only allow advancing exactly one step forward
  return newIdx === currentIdx + 1;
}

/**
 * describeAllowedNext — returns a human-readable string of the only valid
 * next status for a given current status, or null if already terminal.
 *
 * @param {string} currentStatus  Title-case status currently stored.
 * @returns {string|null}
 */
function describeAllowedNext(currentStatus) {
  const currentIdx = STATUS_LIFECYCLE.indexOf(currentStatus);
  if (currentIdx === -1 || currentIdx === STATUS_LIFECYCLE.length - 1) {
    return null; // unknown or already at terminal
  }
  return STATUS_LIFECYCLE[currentIdx + 1];
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

/* ─── GET /api/kitchen/orders/status/:status ─────────────────────────────── */

/**
 * getKitchenOrdersByStatus — returns orders filtered by status, newest first.
 *
 * The `:status` URL param accepts the same case-insensitive inputs as the
 * update endpoint (pending | preparing | ready | served | completed).
 * Returns an empty array (not 404) when no orders match — the kitchen
 * dashboard treats "no orders in this lane" as a valid, normal state.
 */
async function getKitchenOrdersByStatus(req, res) {
  try {
    const { status } = req.params;

    /* ── Validate status value ── */
    if (!status || String(status).trim() === '') {
      return res.status(400).json({
        error: 'status parameter is required.',
        validStatuses: Object.keys(STATUS_MAP),
      });
    }

    const canonicalStatus = STATUS_MAP[String(status).toLowerCase().trim()];

    if (!canonicalStatus) {
      return res.status(400).json({
        error: `"${status}" is not a valid order status.`,
        validStatuses: Object.keys(STATUS_MAP),
      });
    }

    const orders = await findOrdersByStatus(canonicalStatus);

    return res.status(200).json({
      status: canonicalStatus,
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error('[getKitchenOrdersByStatus] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch orders by status. Please try again.' });
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
 * updateKitchenOrderStatus — validates the incoming status, enforces the
 * forward-only lifecycle transition rule, and writes the new status to MongoDB.
 *
 * Transition rules (strict, one-step-at-a-time):
 *   Pending   → Preparing  ✓
 *   Preparing → Ready      ✓
 *   Ready     → Served     ✓  (also accepted as "completed")
 *
 *   Any skip (e.g. Pending → Ready) or backwards move is rejected with 422.
 *   Re-applying the same status is also rejected.
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
        validStatuses: Object.keys(STATUS_MAP),
      });
    }

    /* ── 3. Normalise and validate status value ── */
    const normalisedStatus = STATUS_MAP[String(status).toLowerCase().trim()];

    if (!normalisedStatus) {
      return res.status(400).json({
        error: `"${status}" is not a valid order status.`,
        validStatuses: Object.keys(STATUS_MAP),
      });
    }

    /* ── 4. Fetch the current order to validate the transition ── */
    const currentOrder = await findKitchenOrderById(id);

    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    /* ── 5. Enforce the forward-only lifecycle transition ── */
    if (currentOrder.status === normalisedStatus) {
      return res.status(422).json({
        error: `Order is already in "${normalisedStatus}" status.`,
        currentStatus: currentOrder.status,
      });
    }

    if (!isValidTransition(currentOrder.status, normalisedStatus)) {
      const allowedNext = describeAllowedNext(currentOrder.status);
      const isTerminal  = currentOrder.status === STATUS_LIFECYCLE[STATUS_LIFECYCLE.length - 1];

      if (isTerminal) {
        return res.status(422).json({
          error: `Order is already in the terminal status "${currentOrder.status}" and cannot be updated further.`,
          currentStatus: currentOrder.status,
        });
      }

      return res.status(422).json({
        error: `Invalid status transition: "${currentOrder.status}" → "${normalisedStatus}". Orders must advance one step at a time.`,
        currentStatus: currentOrder.status,
        allowedNextStatus: allowedNext,
      });
    }

    /* ── 6. Apply the update ── */
    const updated = await updateOrderStatus(id, normalisedStatus);

    if (!updated) {
      // Extremely unlikely (order existed a moment ago) — treat as server error
      return res.status(500).json({ error: 'Failed to update order status. Please try again.' });
    }

    return res.status(200).json({
      message: `Order status updated: "${currentOrder.status}" → "${normalisedStatus}".`,
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
  getKitchenOrdersByStatus,
  getKitchenOrderById,
  updateKitchenOrderStatus,
};
