'use strict';

/**
 * kitchenController.js — ServeSync (Member 4)
 *
 * Express controller functions for the Kitchen Dashboard API.
 *
 * Status lifecycle (mirrors Member 2's Order.js ORDER_STATUSES):
 *   Pending → Preparing → Ready → Served
 *
 * Accepted external status names (task-spec, lowercase):
 *   pending | preparing | ready | completed
 *
 * "completed" is stored internally as "Served" to stay consistent with
 * Member 2's existing order documents.  "served" is accepted as input
 * but NOT advertised in error messages — the canonical user-facing term
 * for the terminal status is "completed".
 *
 * All inputs are normalised to Title-case before any MongoDB write.
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
 * Canonical Title-case statuses stored in MongoDB (Member 2's schema).
 * Array index defines the ONLY valid forward progression — a transition
 * is valid only when newIndex === currentIndex + 1.
 *
 *   0 → Pending
 *   1 → Preparing
 *   2 → Ready
 *   3 → Served
 */
const STATUS_LIFECYCLE = ['Pending', 'Preparing', 'Ready', 'Served'];

/**
 * User-facing valid status names (task-spec, lowercase).
 * These are the ONLY values that should appear in validation error hints
 * shown to API callers.  "served" is intentionally omitted — callers
 * should use "completed" for the terminal state.
 */
const VALID_INPUT_STATUSES = ['pending', 'preparing', 'ready', 'completed'];

/**
 * Map of accepted input strings (lowercased) → canonical stored value.
 *
 * "completed" is the user-facing terminal status; it maps to "Served"
 * which is what Member 2 persists in MongoDB.
 * "served" is also accepted silently for backward-compatibility with
 * any direct API calls, but is NOT listed in VALID_INPUT_STATUSES.
 */
const STATUS_MAP = {
  pending:   'Pending',
  preparing: 'Preparing',
  ready:     'Ready',
  completed: 'Served',   // primary user-facing terminal status
  served:    'Served',   // backward-compat alias — not advertised in errors
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
 * Permitted sequences (one step at a time, no skipping, no going back):
 *   Pending   → Preparing   ✓
 *   Preparing → Ready       ✓
 *   Ready     → Served      ✓
 *
 * Everything else is rejected:
 *   Pending → Ready          ✗  (skip)
 *   Pending → Served         ✗  (skip two)
 *   Ready   → Preparing      ✗  (backwards)
 *   Served  → anything       ✗  (terminal)
 *
 * @param {string} currentStatus  Title-case status currently stored in MongoDB.
 * @param {string} newStatus      Title-case status being requested.
 * @returns {boolean}
 */
function isValidTransition(currentStatus, newStatus) {
  const currentIdx = STATUS_LIFECYCLE.indexOf(currentStatus);
  const newIdx     = STATUS_LIFECYCLE.indexOf(newStatus);

  // Both statuses must exist in the lifecycle array
  if (currentIdx === -1 || newIdx === -1) return false;

  // Only allow advancing exactly one step forward
  return newIdx === currentIdx + 1;
}

/**
 * describeAllowedNext — returns the ONLY valid next status (Title-case)
 * for the given current status, or null when already at the terminal state.
 *
 * Used to build helpful error messages that tell the caller what they
 * should send instead of a rejected transition.
 *
 * @param {string} currentStatus  Title-case status currently stored.
 * @returns {string|null}
 */
function describeAllowedNext(currentStatus) {
  const currentIdx = STATUS_LIFECYCLE.indexOf(currentStatus);
  if (currentIdx === -1 || currentIdx === STATUS_LIFECYCLE.length - 1) {
    return null; // unknown or already at terminal (Served / completed)
  }
  return STATUS_LIFECYCLE[currentIdx + 1];
}

/**
 * toUserFacingStatus — converts an internal Title-case canonical status
 * back to its user-facing lowercase name used in API hints.
 *
 * "Served" is shown as "completed" because that is the task-spec name
 * that callers are expected to send.
 *
 * @param {string} canonical  e.g. 'Pending', 'Served'
 * @returns {string}          e.g. 'pending', 'completed'
 */
function toUserFacingStatus(canonical) {
  if (canonical === 'Served') return 'completed';
  return canonical.toLowerCase();
}

/* ─── GET /api/kitchen/orders ────────────────────────────────────────────── */

/**
 * getAllKitchenOrders — returns every order in the `orders` collection,
 * newest first.  Responds with an empty array when no orders exist.
 *
 * Response shape:
 *   { count: number, orders: Order[] }
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
 * Valid `:status` values (case-insensitive):
 *   pending | preparing | ready | completed
 *
 * Returns an empty array (not 404) when no orders match the requested status —
 * an empty lane is a normal, valid state for the kitchen dashboard.
 *
 * Response shape:
 *   { status: string, count: number, orders: Order[] }
 */
async function getKitchenOrdersByStatus(req, res) {
  try {
    const { status } = req.params;

    /* ── 1. Ensure a status param was supplied ── */
    if (!status || String(status).trim() === '') {
      return res.status(400).json({
        error: 'status parameter is required.',
        validStatuses: VALID_INPUT_STATUSES,
      });
    }

    /* ── 2. Normalise and validate ── */
    const canonicalStatus = STATUS_MAP[String(status).toLowerCase().trim()];

    if (!canonicalStatus) {
      return res.status(400).json({
        error: `"${status}" is not a valid order status.`,
        validStatuses: VALID_INPUT_STATUSES,
      });
    }

    /* ── 3. Query MongoDB ── */
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
 *
 * Response shape:
 *   { order: Order }
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
 * strict forward-only lifecycle transition rule, and writes the new status
 * and an updated `updatedAt` timestamp to MongoDB.
 *
 * Validation sequence:
 *   1. Validate MongoDB ObjectId format.
 *   2. Ensure `status` is present in the request body.
 *   3. Ensure `status` is one of the four valid values.
 *   4. Fetch the current order — return 404 if it doesn't exist.
 *   5. Reject if the order is already in the requested status (422).
 *   6. Reject if the transition is not the immediate next step (422).
 *   7. Write the new status + updatedAt to MongoDB.
 *   8. Return the full updated order document.
 *
 * Permitted transitions (strict one-step-at-a-time, forward only):
 *   pending   → preparing   ✓
 *   preparing → ready       ✓
 *   ready     → completed   ✓
 *
 * Rejected transitions (examples):
 *   pending → ready          ✗  (skips preparing)
 *   pending → completed      ✗  (skips two steps)
 *   ready   → preparing      ✗  (backwards)
 *   completed → anything     ✗  (terminal — no further moves allowed)
 *
 * Response shape (200):
 *   { message: string, order: Order }
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
        validStatuses: VALID_INPUT_STATUSES,
      });
    }

    /* ── 3. Normalise and validate status value ── */
    const normalisedStatus = STATUS_MAP[String(status).toLowerCase().trim()];

    if (!normalisedStatus) {
      return res.status(400).json({
        error: `"${status}" is not a valid order status.`,
        validStatuses: VALID_INPUT_STATUSES,
      });
    }

    /* ── 4. Fetch the current order to validate the transition ── */
    const currentOrder = await findKitchenOrderById(id);

    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    /* ── 5. Reject same-status re-application ── */
    if (currentOrder.status === normalisedStatus) {
      return res.status(422).json({
        error: `Order is already in "${toUserFacingStatus(normalisedStatus)}" status.`,
        currentStatus: toUserFacingStatus(currentOrder.status),
      });
    }

    /* ── 6. Enforce the strict forward-only lifecycle transition ── */
    if (!isValidTransition(currentOrder.status, normalisedStatus)) {
      const allowedNextCanonical = describeAllowedNext(currentOrder.status);
      const isTerminal = currentOrder.status === STATUS_LIFECYCLE[STATUS_LIFECYCLE.length - 1];

      if (isTerminal) {
        return res.status(422).json({
          error: `Order is already completed and cannot be updated further.`,
          currentStatus: toUserFacingStatus(currentOrder.status),
        });
      }

      return res.status(422).json({
        error: `Invalid status transition: "${toUserFacingStatus(currentOrder.status)}" → "${toUserFacingStatus(normalisedStatus)}". Orders must advance one step at a time.`,
        currentStatus: toUserFacingStatus(currentOrder.status),
        allowedNextStatus: toUserFacingStatus(allowedNextCanonical),
      });
    }

    /* ── 7. Apply the update (also sets updatedAt via the repository) ── */
    const updated = await updateOrderStatus(id, normalisedStatus);

    if (!updated) {
      // Extremely unlikely (order existed moments ago) — treat as server error
      return res.status(500).json({ error: 'Failed to update order status. Please try again.' });
    }

    /* ── 8. Return success with the full updated document ── */
    return res.status(200).json({
      message: `Order status updated: "${toUserFacingStatus(currentOrder.status)}" → "${toUserFacingStatus(normalisedStatus)}".`,
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
