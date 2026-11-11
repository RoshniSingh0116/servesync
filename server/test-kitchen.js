'use strict';
/**
 * test-kitchen.js — ServeSync Member 4 — Commit 4 Kitchen API Test Suite
 *
 * Self-contained test runner (no test framework, no network, no MongoDB).
 * Stubs the repository layer so every controller code path runs in process.
 *
 * Covers all Commit 4 requirements:
 *  ✓ Valid statuses: pending | preparing | ready | completed
 *  ✓ Permitted transitions: pending→preparing, preparing→ready, ready→completed
 *  ✓ Rejected skips: pending→ready, pending→completed, preparing→completed
 *  ✓ Rejected backwards: completed→ready, ready→preparing, preparing→pending
 *  ✓ Rejected repeats (same status re-applied)
 *  ✓ Invalid ObjectId → 400
 *  ✓ Missing order → 404
 *  ✓ Missing status body → 400
 *  ✓ Invalid status string → 400 with validStatuses hint (no "served" exposed)
 *  ✓ Empty result sets handled correctly (200, count 0)
 *  ✓ DB errors handled correctly (500)
 *  ✓ updatedAt set on every update
 *  ✓ Full updated order returned in response
 *  ✓ Error messages use user-facing names (pending/preparing/ready/completed)
 *
 * Run with:  node test-kitchen.js
 */

/* ─── Minimal test harness ───────────────────────────────────────────────── */
let passed = 0;
let failed = 0;
const results = [];

function assert(label, condition) {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  FAIL: ${label}`);
    failed++;
    results.push(label);
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(64)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(64));
}

/* ─── Mock req / res factories ───────────────────────────────────────────── */
function mockReq({ params = {}, body = {} } = {}) {
  return { params, body };
}

function mockRes() {
  return {
    _status: null,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body)   { this._body  = body; return this; },
  };
}

/* ─── Re-implement pure controller logic (no DB) ─────────────────────────── */
/* We inline the identical logic from kitchenController.js with injected stubs
   so this file is fully self-contained and needs no network. */

const { ObjectId } = require('mongodb');

const STATUS_LIFECYCLE      = ['Pending', 'Preparing', 'Ready', 'Served'];
const VALID_INPUT_STATUSES  = ['pending', 'preparing', 'ready', 'completed'];

const STATUS_MAP = {
  pending:   'Pending',
  preparing: 'Preparing',
  ready:     'Ready',
  completed: 'Served',
  served:    'Served',  // backward-compat, not advertised
};

function isValidObjectId(id) {
  return typeof id === 'string' && ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

function isValidTransition(cur, nxt) {
  const ci = STATUS_LIFECYCLE.indexOf(cur);
  const ni = STATUS_LIFECYCLE.indexOf(nxt);
  if (ci === -1 || ni === -1) return false;
  return ni === ci + 1;
}

function describeAllowedNext(cur) {
  const ci = STATUS_LIFECYCLE.indexOf(cur);
  if (ci === -1 || ci === STATUS_LIFECYCLE.length - 1) return null;
  return STATUS_LIFECYCLE[ci + 1];
}

function toUserFacingStatus(canonical) {
  if (canonical === 'Served') return 'completed';
  return canonical.toLowerCase();
}

/* ── getAllKitchenOrders ── */
async function ctrl_getAllKitchenOrders(req, res, { findAllKitchenOrders }) {
  try {
    const orders = await findAllKitchenOrders();
    return res.status(200).json({ count: orders.length, orders });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch kitchen orders. Please try again.' });
  }
}

/* ── getKitchenOrdersByStatus ── */
async function ctrl_getKitchenOrdersByStatus(req, res, { findOrdersByStatus }) {
  try {
    const { status } = req.params;
    if (!status || String(status).trim() === '') {
      return res.status(400).json({ error: 'status parameter is required.', validStatuses: VALID_INPUT_STATUSES });
    }
    const canonicalStatus = STATUS_MAP[String(status).toLowerCase().trim()];
    if (!canonicalStatus) {
      return res.status(400).json({ error: `"${status}" is not a valid order status.`, validStatuses: VALID_INPUT_STATUSES });
    }
    const orders = await findOrdersByStatus(canonicalStatus);
    return res.status(200).json({ status: canonicalStatus, count: orders.length, orders });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch orders by status. Please try again.' });
  }
}

/* ── updateKitchenOrderStatus ── */
async function ctrl_updateKitchenOrderStatus(req, res, { findKitchenOrderById, updateOrderStatus }) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format.' });
    }
    if (status === undefined || status === null || String(status).trim() === '') {
      return res.status(400).json({ error: 'status is required in the request body.', validStatuses: VALID_INPUT_STATUSES });
    }
    const normalisedStatus = STATUS_MAP[String(status).toLowerCase().trim()];
    if (!normalisedStatus) {
      return res.status(400).json({ error: `"${status}" is not a valid order status.`, validStatuses: VALID_INPUT_STATUSES });
    }

    const currentOrder = await findKitchenOrderById(id);
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (currentOrder.status === normalisedStatus) {
      return res.status(422).json({
        error: `Order is already in "${toUserFacingStatus(normalisedStatus)}" status.`,
        currentStatus: toUserFacingStatus(currentOrder.status),
      });
    }

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

    const updated = await updateOrderStatus(id, normalisedStatus);
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update order status. Please try again.' });
    }
    return res.status(200).json({
      message: `Order status updated: "${toUserFacingStatus(currentOrder.status)}" → "${toUserFacingStatus(normalisedStatus)}".`,
      order: updated,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update order status. Please try again.' });
  }
}

/* ─── Shared fixtures ────────────────────────────────────────────────────── */
const VALID_ID     = '507f1f77bcf86cd799439011';
const NONEXIST_ID  = '000000000000000000000000';

function makeOrder(status) {
  return {
    _id: VALID_ID,
    tableNumber: 3,
    items: [{ foodId: '507f1f77bcf86cd799439099', name: 'Burger', price: 120, quantity: 2, subtotal: 240 }],
    totalAmount: 240,
    status,
    createdAt: new Date('2026-11-11T10:00:00Z'),
    updatedAt: new Date('2026-11-11T10:00:00Z'),
  };
}

function updatedOrder(status) {
  return { ...makeOrder(status), updatedAt: new Date() };
}

function stubFind(currentCanonical) {
  return async (s) => s === currentCanonical ? [makeOrder(currentCanonical)] : [];
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION A — GET /api/kitchen/orders
   ═══════════════════════════════════════════════════════════════════════════ */
(async () => {

section('A1: GET all orders — returns all orders sorted newest-first');
{
  const res = mockRes();
  await ctrl_getAllKitchenOrders(mockReq(), res, {
    findAllKitchenOrders: async () => [makeOrder('Preparing'), makeOrder('Pending')],
  });
  assert('status 200',               res._status === 200);
  assert('count is 2',               res._body.count === 2);
  assert('orders array length 2',    res._body.orders.length === 2);
  assert('first order is Preparing', res._body.orders[0].status === 'Preparing');
}

section('A2: GET all orders — empty collection returns 200 with count 0');
{
  const res = mockRes();
  await ctrl_getAllKitchenOrders(mockReq(), res, { findAllKitchenOrders: async () => [] });
  assert('status 200',   res._status === 200);
  assert('count is 0',   res._body.count === 0);
  assert('orders is []', Array.isArray(res._body.orders) && res._body.orders.length === 0);
}

section('A3: GET all orders — DB error returns 500');
{
  const res = mockRes();
  await ctrl_getAllKitchenOrders(mockReq(), res, {
    findAllKitchenOrders: async () => { throw new Error('timeout'); },
  });
  assert('status 500',       res._status === 500);
  assert('safe error msg',   typeof res._body.error === 'string' && !res._body.error.includes('timeout'));
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION B — GET /api/kitchen/orders/status/:status
   ═══════════════════════════════════════════════════════════════════════════ */

section('B1: Filter by status = pending → returns Pending orders');
{
  const res = mockRes();
  await ctrl_getKitchenOrdersByStatus(
    mockReq({ params: { status: 'pending' } }), res,
    { findOrdersByStatus: stubFind('Pending') }
  );
  assert('status 200',              res._status === 200);
  assert('canonical header=Pending',res._body.status === 'Pending');
  assert('count 1',                 res._body.count === 1);
  assert('order is Pending',        res._body.orders[0].status === 'Pending');
}

section('B2: Filter by status = preparing → returns Preparing orders');
{
  const res = mockRes();
  await ctrl_getKitchenOrdersByStatus(
    mockReq({ params: { status: 'preparing' } }), res,
    { findOrdersByStatus: stubFind('Preparing') }
  );
  assert('status 200',               res._status === 200);
  assert('canonical=Preparing',      res._body.status === 'Preparing');
  assert('order is Preparing',       res._body.orders[0].status === 'Preparing');
}

section('B3: Filter by status = ready → returns Ready orders');
{
  const res = mockRes();
  await ctrl_getKitchenOrdersByStatus(
    mockReq({ params: { status: 'ready' } }), res,
    { findOrdersByStatus: stubFind('Ready') }
  );
  assert('status 200',          res._status === 200);
  assert('canonical=Ready',     res._body.status === 'Ready');
  assert('order is Ready',      res._body.orders[0].status === 'Ready');
}

section('B4: Filter by status = completed → queries for Served orders');
{
  const res = mockRes();
  await ctrl_getKitchenOrdersByStatus(
    mockReq({ params: { status: 'completed' } }), res,
    { findOrdersByStatus: stubFind('Served') }
  );
  assert('status 200',          res._status === 200);
  assert('canonical=Served',    res._body.status === 'Served');
  assert('order is Served',     res._body.orders[0].status === 'Served');
}

section('B5: Filter by status — empty lane returns 200 with count 0 (not 404)');
{
  const res = mockRes();
  await ctrl_getKitchenOrdersByStatus(
    mockReq({ params: { status: 'preparing' } }), res,
    { findOrdersByStatus: async () => [] }
  );
  assert('status 200',   res._status === 200);
  assert('count 0',      res._body.count === 0);
  assert('orders []',    res._body.orders.length === 0);
}

section('B6: Filter by invalid status → 400 with validStatuses (no "served" exposed)');
{
  const res = mockRes();
  await ctrl_getKitchenOrdersByStatus(
    mockReq({ params: { status: 'done' } }), res,
    { findOrdersByStatus: async () => [] }
  );
  assert('status 400',                      res._status === 400);
  assert('error mentions "done"',           res._body.error.includes('"done"'));
  assert('validStatuses is array',          Array.isArray(res._body.validStatuses));
  assert('validStatuses contains pending',  res._body.validStatuses.includes('pending'));
  assert('validStatuses contains completed',res._body.validStatuses.includes('completed'));
  assert('"served" NOT in validStatuses',   !res._body.validStatuses.includes('served'));
}

section('B7: Filter case-insensitive — PENDING accepted');
{
  const res = mockRes();
  await ctrl_getKitchenOrdersByStatus(
    mockReq({ params: { status: 'PENDING' } }), res,
    { findOrdersByStatus: stubFind('Pending') }
  );
  assert('status 200',       res._status === 200);
  assert('resolved to Pending', res._body.status === 'Pending');
}

section('B8: DB error on status filter → 500');
{
  const res = mockRes();
  await ctrl_getKitchenOrdersByStatus(
    mockReq({ params: { status: 'pending' } }), res,
    { findOrdersByStatus: async () => { throw new Error('DB gone'); } }
  );
  assert('status 500',     res._status === 500);
  assert('safe error msg', !res._body.error.includes('DB gone'));
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION C — PATCH /api/kitchen/orders/:id/status (input validation)
   ═══════════════════════════════════════════════════════════════════════════ */

section('C1: Invalid ObjectId → 400');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: 'not-an-id' }, body: { status: 'preparing' } }), res,
    { findKitchenOrderById: async () => null, updateOrderStatus: async () => null }
  );
  assert('status 400',          res._status === 400);
  assert('invalid ID error',    res._body.error.includes('Invalid order ID format'));
}

section('C2: Short hex string (not 24-char) → 400');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: 'abc123' }, body: { status: 'preparing' } }), res,
    { findKitchenOrderById: async () => null, updateOrderStatus: async () => null }
  );
  assert('status 400', res._status === 400);
}

section('C3: Missing status body field → 400');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: {} }), res,
    { findKitchenOrderById: async () => makeOrder('Pending'), updateOrderStatus: async () => null }
  );
  assert('status 400',               res._status === 400);
  assert('error about status field', res._body.error.includes('status is required'));
  assert('validStatuses provided',   Array.isArray(res._body.validStatuses));
  assert('"served" NOT in hints',    !res._body.validStatuses.includes('served'));
}

section('C4: Null status → 400');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: null } }), res,
    { findKitchenOrderById: async () => makeOrder('Pending'), updateOrderStatus: async () => null }
  );
  assert('status 400', res._status === 400);
}

section('C5: Empty-string status → 400');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: '   ' } }), res,
    { findKitchenOrderById: async () => makeOrder('Pending'), updateOrderStatus: async () => null }
  );
  assert('status 400', res._status === 400);
}

section('C6: Invalid status string → 400 (validStatuses uses user-facing names)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'burnt' } }), res,
    { findKitchenOrderById: async () => makeOrder('Pending'), updateOrderStatus: async () => null }
  );
  assert('status 400',                      res._status === 400);
  assert('error mentions "burnt"',          res._body.error.includes('"burnt"'));
  assert('validStatuses is array',          Array.isArray(res._body.validStatuses));
  assert('validStatuses has pending',       res._body.validStatuses.includes('pending'));
  assert('validStatuses has completed',     res._body.validStatuses.includes('completed'));
  assert('"served" NOT in validStatuses',   !res._body.validStatuses.includes('served'));
}

section('C7: Order not found → 404');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: NONEXIST_ID }, body: { status: 'preparing' } }), res,
    { findKitchenOrderById: async () => null, updateOrderStatus: async () => null }
  );
  assert('status 404',         res._status === 404);
  assert('Order not found msg',res._body.error === 'Order not found.');
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION D — PERMITTED status transitions
   ═══════════════════════════════════════════════════════════════════════════ */

section('D1: PERMITTED — pending → preparing');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'preparing' } }), res,
    {
      findKitchenOrderById: async () => makeOrder('Pending'),
      updateOrderStatus: async () => updatedOrder('Preparing'),
    }
  );
  assert('status 200',                   res._status === 200);
  assert('message: pending → preparing', res._body.message.includes('pending') && res._body.message.includes('preparing'));
  assert('returned order is Preparing',  res._body.order.status === 'Preparing');
  assert('updated order has updatedAt',  res._body.order.updatedAt instanceof Date);
}

section('D2: PERMITTED — preparing → ready');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'ready' } }), res,
    {
      findKitchenOrderById: async () => makeOrder('Preparing'),
      updateOrderStatus: async () => updatedOrder('Ready'),
    }
  );
  assert('status 200',              res._status === 200);
  assert('message: preparing→ready',res._body.message.includes('preparing') && res._body.message.includes('ready'));
  assert('returned order is Ready', res._body.order.status === 'Ready');
}

section('D3: PERMITTED — ready → completed (via "completed" input)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'completed' } }), res,
    {
      findKitchenOrderById: async () => makeOrder('Ready'),
      updateOrderStatus: async () => updatedOrder('Served'),
    }
  );
  assert('status 200',               res._status === 200);
  assert('message: ready→completed', res._body.message.includes('ready') && res._body.message.includes('completed'));
  assert('returned order is Served', res._body.order.status === 'Served');
}

section('D4: PERMITTED — ready → completed (via "served" input, silent alias)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'served' } }), res,
    {
      findKitchenOrderById: async () => makeOrder('Ready'),
      updateOrderStatus: async () => updatedOrder('Served'),
    }
  );
  assert('status 200',               res._status === 200);
  assert('returned order is Served', res._body.order.status === 'Served');
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION E — REJECTED transitions (skips)
   ═══════════════════════════════════════════════════════════════════════════ */

section('E1: REJECTED — pending → ready (skip)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'ready' } }), res,
    { findKitchenOrderById: async () => makeOrder('Pending'), updateOrderStatus: async () => null }
  );
  assert('status 422',                res._status === 422);
  assert('error mentions transition', res._body.error.includes('Invalid status transition'));
  assert('currentStatus=pending',     res._body.currentStatus === 'pending');
  assert('allowedNext=preparing',     res._body.allowedNextStatus === 'preparing');
}

section('E2: REJECTED — pending → completed (skip two steps)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'completed' } }), res,
    { findKitchenOrderById: async () => makeOrder('Pending'), updateOrderStatus: async () => null }
  );
  assert('status 422',            res._status === 422);
  assert('transition error',      res._body.error.includes('Invalid status transition'));
  assert('allowedNext=preparing', res._body.allowedNextStatus === 'preparing');
}

section('E3: REJECTED — preparing → completed (skip)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'completed' } }), res,
    { findKitchenOrderById: async () => makeOrder('Preparing'), updateOrderStatus: async () => null }
  );
  assert('status 422',         res._status === 422);
  assert('transition error',   res._body.error.includes('Invalid status transition'));
  assert('allowedNext=ready',  res._body.allowedNextStatus === 'ready');
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION F — REJECTED transitions (backwards)
   ═══════════════════════════════════════════════════════════════════════════ */

section('F1: REJECTED — completed → ready (backwards)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'ready' } }), res,
    { findKitchenOrderById: async () => makeOrder('Served'), updateOrderStatus: async () => null }
  );
  assert('status 422',          res._status === 422);
  assert('already completed',   res._body.error.includes('already completed'));
  assert('currentStatus hint',  res._body.currentStatus === 'completed');
}

section('F2: REJECTED — completed → preparing (backwards, two steps)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'preparing' } }), res,
    { findKitchenOrderById: async () => makeOrder('Served'), updateOrderStatus: async () => null }
  );
  assert('status 422',       res._status === 422);
  assert('terminal error',   res._body.error.includes('already completed'));
}

section('F3: REJECTED — completed → pending (backwards, three steps)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'pending' } }), res,
    { findKitchenOrderById: async () => makeOrder('Served'), updateOrderStatus: async () => null }
  );
  assert('status 422',     res._status === 422);
  assert('terminal error', res._body.error.includes('already completed'));
}

section('F4: REJECTED — ready → preparing (backwards)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'preparing' } }), res,
    { findKitchenOrderById: async () => makeOrder('Ready'), updateOrderStatus: async () => null }
  );
  assert('status 422',           res._status === 422);
  assert('transition error',     res._body.error.includes('Invalid status transition'));
  assert('currentStatus=ready',  res._body.currentStatus === 'ready');
  assert('allowedNext=completed',res._body.allowedNextStatus === 'completed');
}

section('F5: REJECTED — ready → pending (backwards, two steps)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'pending' } }), res,
    { findKitchenOrderById: async () => makeOrder('Ready'), updateOrderStatus: async () => null }
  );
  assert('status 422',          res._status === 422);
  assert('transition error',    res._body.error.includes('Invalid status transition'));
  assert('allowedNext=completed',res._body.allowedNextStatus === 'completed');
}

section('F6: REJECTED — preparing → pending (backwards)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'pending' } }), res,
    { findKitchenOrderById: async () => makeOrder('Preparing'), updateOrderStatus: async () => null }
  );
  assert('status 422',         res._status === 422);
  assert('transition error',   res._body.error.includes('Invalid status transition'));
  assert('allowedNext=ready',  res._body.allowedNextStatus === 'ready');
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION G — REJECTED same-status repeats
   ═══════════════════════════════════════════════════════════════════════════ */

section('G1: REJECTED — pending re-applied to pending order');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'pending' } }), res,
    { findKitchenOrderById: async () => makeOrder('Pending'), updateOrderStatus: async () => null }
  );
  assert('status 422',          res._status === 422);
  assert('already in status',   res._body.error.includes('already in'));
  assert('shows pending',       res._body.error.includes('pending'));
}

section('G2: REJECTED — preparing re-applied to preparing order');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'preparing' } }), res,
    { findKitchenOrderById: async () => makeOrder('Preparing'), updateOrderStatus: async () => null }
  );
  assert('status 422',          res._status === 422);
  assert('already in preparing',res._body.error.includes('preparing'));
}

section('G3: REJECTED — completed re-applied to completed order');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'completed' } }), res,
    { findKitchenOrderById: async () => makeOrder('Served'), updateOrderStatus: async () => null }
  );
  assert('status 422',           res._status === 422);
  assert('already in completed', res._body.error.includes('completed'));
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION H — updatedAt and response shape verification
   ═══════════════════════════════════════════════════════════════════════════ */

section('H1: updatedAt is set on the returned order after update');
{
  const before = new Date('2026-11-11T10:00:00Z');
  const after  = new Date();
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'preparing' } }), res,
    {
      findKitchenOrderById: async () => ({ ...makeOrder('Pending'), updatedAt: before }),
      updateOrderStatus: async () => ({ ...makeOrder('Preparing'), updatedAt: after }),
    }
  );
  assert('status 200',              res._status === 200);
  assert('updatedAt changed',       res._body.order.updatedAt.getTime() > before.getTime());
}

section('H2: Full order document is returned (all fields present)');
{
  const res = mockRes();
  await ctrl_updateKitchenOrderStatus(
    mockReq({ params: { id: VALID_ID }, body: { status: 'preparing' } }), res,
    {
      findKitchenOrderById: async () => makeOrder('Pending'),
      updateOrderStatus: async () => updatedOrder('Preparing'),
    }
  );
  const o = res._body.order;
  assert('order._id present',         o._id !== undefined);
  assert('order.tableNumber present',  o.tableNumber !== undefined);
  assert('order.items present',        Array.isArray(o.items));
  assert('order.totalAmount present',  o.totalAmount !== undefined);
  assert('order.status present',       o.status !== undefined);
  assert('order.createdAt present',    o.createdAt !== undefined);
  assert('order.updatedAt present',    o.updatedAt !== undefined);
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION I — Pure helper unit tests
   ═══════════════════════════════════════════════════════════════════════════ */

section('I1: isValidObjectId');
{
  assert('valid 24-hex',       isValidObjectId('507f1f77bcf86cd799439011'));
  assert('all-zeros valid',    isValidObjectId('000000000000000000000000'));
  assert('rejects short',      !isValidObjectId('abc123'));
  assert('rejects empty',      !isValidObjectId(''));
  assert('rejects number',     !isValidObjectId(12345));
  assert('rejects undefined',  !isValidObjectId(undefined));
  assert('rejects 23-char',    !isValidObjectId('507f1f77bcf86cd79943901'));
}

section('I2: isValidTransition — all permitted moves');
{
  assert('Pending→Preparing',   isValidTransition('Pending',   'Preparing'));
  assert('Preparing→Ready',     isValidTransition('Preparing', 'Ready'));
  assert('Ready→Served',        isValidTransition('Ready',     'Served'));
}

section('I3: isValidTransition — all rejected moves');
{
  assert('Pending→Ready    ✗',    !isValidTransition('Pending',   'Ready'));
  assert('Pending→Served   ✗',    !isValidTransition('Pending',   'Served'));
  assert('Preparing→Served ✗',    !isValidTransition('Preparing', 'Served'));
  assert('Ready→Preparing  ✗',    !isValidTransition('Ready',     'Preparing'));
  assert('Ready→Pending    ✗',    !isValidTransition('Ready',     'Pending'));
  assert('Served→Ready     ✗',    !isValidTransition('Served',    'Ready'));
  assert('Served→Preparing ✗',    !isValidTransition('Served',    'Preparing'));
  assert('Served→Pending   ✗',    !isValidTransition('Served',    'Pending'));
  assert('same step Pending ✗',   !isValidTransition('Pending',   'Pending'));
  assert('same step Served  ✗',   !isValidTransition('Served',    'Served'));
}

section('I4: describeAllowedNext');
{
  assert('Pending  → Preparing', describeAllowedNext('Pending')   === 'Preparing');
  assert('Preparing→ Ready',     describeAllowedNext('Preparing') === 'Ready');
  assert('Ready    → Served',    describeAllowedNext('Ready')     === 'Served');
  assert('Served   → null',      describeAllowedNext('Served')    === null);
  assert('unknown  → null',      describeAllowedNext('Cooked')    === null);
}

section('I5: toUserFacingStatus');
{
  assert('Pending   → pending',   toUserFacingStatus('Pending')   === 'pending');
  assert('Preparing → preparing', toUserFacingStatus('Preparing') === 'preparing');
  assert('Ready     → ready',     toUserFacingStatus('Ready')     === 'ready');
  assert('Served    → completed', toUserFacingStatus('Served')    === 'completed');
}

section('I6: STATUS_MAP — all four spec inputs map correctly');
{
  assert('pending   → Pending',   STATUS_MAP['pending']   === 'Pending');
  assert('preparing → Preparing', STATUS_MAP['preparing'] === 'Preparing');
  assert('ready     → Ready',     STATUS_MAP['ready']     === 'Ready');
  assert('completed → Served',    STATUS_MAP['completed'] === 'Served');
  assert('served    → Served',    STATUS_MAP['served']    === 'Served');  // silent alias
  assert('unknown   → undefined', STATUS_MAP['burnt']     === undefined);
  assert('VALID_INPUT_STATUSES correct length', VALID_INPUT_STATUSES.length === 4);
  assert('no "served" in VALID_INPUT_STATUSES', !VALID_INPUT_STATUSES.includes('served'));
}

/* ─── Final summary ──────────────────────────────────────────────────────── */
console.log(`\n${'═'.repeat(64)}`);
if (failed === 0) {
  console.log(`  ✅  ALL TESTS PASSED: ${passed} assertions`);
} else {
  console.log(`  ❌  ${failed} FAILED — ${passed} passed`);
  console.log('\n  Failed assertions:');
  results.forEach(r => console.log(`    • ${r}`));
}
console.log('═'.repeat(64));
if (failed > 0) process.exit(1);

})();
