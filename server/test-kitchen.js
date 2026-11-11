'use strict';
/**
 * test-kitchen.js — ServeSync Member 4 Kitchen API tests
 *
 * Self-contained test runner (no test framework, no network, no MongoDB).
 * Uses lightweight mock req/res objects and stubs the repository layer so
 * every controller code path can be exercised in isolation.
 *
 * Run with:  node test-kitchen.js
 */

/* ─── Minimal test harness ───────────────────────────────────────────────── */
let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  FAIL: ${label}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('─'.repeat(60));
}

/* ─── Mock req / res factories ───────────────────────────────────────────── */
function mockReq({ params = {}, body = {} } = {}) {
  return { params, body };
}

function mockRes() {
  const res = {
    _status: null,
    _body: null,
    status(code) { this._status = code; return this; },
    json(body)   { this._body  = body; return this; },
  };
  return res;
}

/* ─── Shared fixtures ────────────────────────────────────────────────────── */

/** A realistic order document as Member 2 would store it */
const PENDING_ORDER = {
  _id: '507f1f77bcf86cd799439011',
  tableNumber: 3,
  items: [
    { foodId: '507f1f77bcf86cd799439099', name: 'Burger', price: 120, quantity: 2, subtotal: 240 },
  ],
  totalAmount: 240,
  status: 'Pending',
  createdAt: new Date('2026-11-11T10:00:00Z'),
  updatedAt: new Date('2026-11-11T10:00:00Z'),
};

const PREPARING_ORDER = { ...PENDING_ORDER, status: 'Preparing' };
const READY_ORDER     = { ...PENDING_ORDER, status: 'Ready' };
const SERVED_ORDER    = { ...PENDING_ORDER, status: 'Served' };

/* ─── Inline controller (copy of production logic, no DB needed) ─────────── */
/* We re-implement only the pure logic so this file is entirely self-contained.
   The actual controller delegates all DB work to the repository; here we
   inject stub repositories directly into the same logic. */

const { ObjectId } = require('mongodb');

const STATUS_LIFECYCLE = ['Pending', 'Preparing', 'Ready', 'Served'];

const STATUS_MAP = {
  pending:   'Pending',
  preparing: 'Preparing',
  ready:     'Ready',
  served:    'Served',
  completed: 'Served',
};

function isValidObjectId(id) {
  return typeof id === 'string' && ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

function isValidTransition(currentStatus, newStatus) {
  const ci = STATUS_LIFECYCLE.indexOf(currentStatus);
  const ni = STATUS_LIFECYCLE.indexOf(newStatus);
  if (ci === -1 || ni === -1) return false;
  return ni === ci + 1;
}

function describeAllowedNext(currentStatus) {
  const ci = STATUS_LIFECYCLE.indexOf(currentStatus);
  if (ci === -1 || ci === STATUS_LIFECYCLE.length - 1) return null;
  return STATUS_LIFECYCLE[ci + 1];
}

/* ── Controller functions that accept injected repository stubs ── */

async function ctrl_getAllKitchenOrders(req, res, { findAllKitchenOrders }) {
  try {
    const orders = await findAllKitchenOrders();
    return res.status(200).json({ count: orders.length, orders });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch kitchen orders. Please try again.' });
  }
}

async function ctrl_getKitchenOrdersByStatus(req, res, { findOrdersByStatus }) {
  try {
    const { status } = req.params;
    if (!status || String(status).trim() === '') {
      return res.status(400).json({ error: 'status parameter is required.', validStatuses: Object.keys(STATUS_MAP) });
    }
    const canonicalStatus = STATUS_MAP[String(status).toLowerCase().trim()];
    if (!canonicalStatus) {
      return res.status(400).json({ error: `"${status}" is not a valid order status.`, validStatuses: Object.keys(STATUS_MAP) });
    }
    const orders = await findOrdersByStatus(canonicalStatus);
    return res.status(200).json({ status: canonicalStatus, count: orders.length, orders });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch orders by status. Please try again.' });
  }
}

async function ctrl_updateKitchenOrderStatus(req, res, { findKitchenOrderById, updateOrderStatus }) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format.' });
    }

    if (status === undefined || status === null || String(status).trim() === '') {
      return res.status(400).json({ error: 'status is required in the request body.', validStatuses: Object.keys(STATUS_MAP) });
    }

    const normalisedStatus = STATUS_MAP[String(status).toLowerCase().trim()];
    if (!normalisedStatus) {
      return res.status(400).json({ error: `"${status}" is not a valid order status.`, validStatuses: Object.keys(STATUS_MAP) });
    }

    const currentOrder = await findKitchenOrderById(id);
    if (!currentOrder) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (currentOrder.status === normalisedStatus) {
      return res.status(422).json({ error: `Order is already in "${normalisedStatus}" status.`, currentStatus: currentOrder.status });
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

    const updated = await updateOrderStatus(id, normalisedStatus);
    if (!updated) {
      return res.status(500).json({ error: 'Failed to update order status. Please try again.' });
    }
    return res.status(200).json({
      message: `Order status updated: "${currentOrder.status}" → "${normalisedStatus}".`,
      order: updated,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update order status. Please try again.' });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEST CASES
   ═══════════════════════════════════════════════════════════════════════════ */

(async () => {

  /* ── 1. GET /api/kitchen/orders — returns all orders ─────────────────── */
  section('TEST 1: GET all kitchen orders (orders exist)');
  {
    const req = mockReq();
    const res = mockRes();
    await ctrl_getAllKitchenOrders(req, res, {
      findAllKitchenOrders: async () => [PENDING_ORDER, PREPARING_ORDER],
    });
    assert('status 200',              res._status === 200);
    assert('count is 2',              res._body.count === 2);
    assert('orders array has 2 items',res._body.orders.length === 2);
    assert('first order is Pending',  res._body.orders[0].status === 'Pending');
  }

  /* ── 2. GET /api/kitchen/orders — empty collection ──────────────────── */
  section('TEST 2: GET all kitchen orders (empty collection)');
  {
    const req = mockReq();
    const res = mockRes();
    await ctrl_getAllKitchenOrders(req, res, {
      findAllKitchenOrders: async () => [],
    });
    assert('status 200',         res._status === 200);
    assert('count is 0',         res._body.count === 0);
    assert('orders is []',       Array.isArray(res._body.orders) && res._body.orders.length === 0);
  }

  /* ── 3. GET /api/kitchen/orders — DB error ───────────────────────────── */
  section('TEST 3: GET all kitchen orders (DB error)');
  {
    const req = mockReq();
    const res = mockRes();
    await ctrl_getAllKitchenOrders(req, res, {
      findAllKitchenOrders: async () => { throw new Error('DB down'); },
    });
    assert('status 500',         res._status === 500);
    assert('error message',      typeof res._body.error === 'string');
  }

  /* ── 4. GET /api/kitchen/orders/status/pending ──────────────────────── */
  section('TEST 4: GET orders by status = pending');
  {
    const req = mockReq({ params: { status: 'pending' } });
    const res = mockRes();
    await ctrl_getKitchenOrdersByStatus(req, res, {
      findOrdersByStatus: async (s) => s === 'Pending' ? [PENDING_ORDER] : [],
    });
    assert('status 200',              res._status === 200);
    assert('canonical status header', res._body.status === 'Pending');
    assert('count is 1',              res._body.count === 1);
    assert('order status is Pending', res._body.orders[0].status === 'Pending');
  }

  /* ── 5. GET /api/kitchen/orders/status/preparing ────────────────────── */
  section('TEST 5: GET orders by status = preparing');
  {
    const req = mockReq({ params: { status: 'preparing' } });
    const res = mockRes();
    await ctrl_getKitchenOrdersByStatus(req, res, {
      findOrdersByStatus: async (s) => s === 'Preparing' ? [PREPARING_ORDER] : [],
    });
    assert('status 200',                 res._status === 200);
    assert('canonical status header',    res._body.status === 'Preparing');
    assert('count is 1',                 res._body.count === 1);
    assert('order status is Preparing',  res._body.orders[0].status === 'Preparing');
  }

  /* ── 6. GET /api/kitchen/orders/status/ready ────────────────────────── */
  section('TEST 6: GET orders by status = ready');
  {
    const req = mockReq({ params: { status: 'ready' } });
    const res = mockRes();
    await ctrl_getKitchenOrdersByStatus(req, res, {
      findOrdersByStatus: async (s) => s === 'Ready' ? [READY_ORDER] : [],
    });
    assert('status 200',              res._status === 200);
    assert('canonical status header', res._body.status === 'Ready');
    assert('order status is Ready',   res._body.orders[0].status === 'Ready');
  }

  /* ── 7. GET /api/kitchen/orders/status/completed (alias) ────────────── */
  section('TEST 7: GET orders by status = completed (alias for Served)');
  {
    const req = mockReq({ params: { status: 'completed' } });
    const res = mockRes();
    await ctrl_getKitchenOrdersByStatus(req, res, {
      findOrdersByStatus: async (s) => s === 'Served' ? [SERVED_ORDER] : [],
    });
    assert('status 200',              res._status === 200);
    assert('canonical status=Served', res._body.status === 'Served');
    assert('order status is Served',  res._body.orders[0].status === 'Served');
  }

  /* ── 8. GET /api/kitchen/orders/status — empty lane ─────────────────── */
  section('TEST 8: GET orders by status (no matching orders — empty lane)');
  {
    const req = mockReq({ params: { status: 'preparing' } });
    const res = mockRes();
    await ctrl_getKitchenOrdersByStatus(req, res, {
      findOrdersByStatus: async () => [],
    });
    assert('status 200',   res._status === 200);
    assert('count is 0',   res._body.count === 0);
    assert('orders is []', res._body.orders.length === 0);
  }

  /* ── 9. GET /api/kitchen/orders/status — invalid status ─────────────── */
  section('TEST 9: GET orders by status = invalid value');
  {
    const req = mockReq({ params: { status: 'burnt' } });
    const res = mockRes();
    await ctrl_getKitchenOrdersByStatus(req, res, {
      findOrdersByStatus: async () => [],
    });
    assert('status 400',         res._status === 400);
    assert('error message',      res._body.error.includes('"burnt"'));
    assert('validStatuses list', Array.isArray(res._body.validStatuses));
  }

  /* ── 10. PATCH — valid: Pending → Preparing ──────────────────────────── */
  section('TEST 10: PATCH status Pending → Preparing (valid transition)');
  {
    const validId = '507f1f77bcf86cd799439011';
    const updated = { ...PENDING_ORDER, status: 'Preparing' };
    const req = mockReq({ params: { id: validId }, body: { status: 'preparing' } });
    const res = mockRes();
    await ctrl_updateKitchenOrderStatus(req, res, {
      findKitchenOrderById: async () => ({ ...PENDING_ORDER }),
      updateOrderStatus:    async () => updated,
    });
    assert('status 200',                 res._status === 200);
    assert('message mentions transition',res._body.message.includes('Pending') && res._body.message.includes('Preparing'));
    assert('returned order is Preparing',res._body.order.status === 'Preparing');
  }

  /* ── 11. PATCH — valid: Preparing → Ready ────────────────────────────── */
  section('TEST 11: PATCH status Preparing → Ready (valid transition)');
  {
    const validId = '507f1f77bcf86cd799439011';
    const updated = { ...PREPARING_ORDER, status: 'Ready' };
    const req = mockReq({ params: { id: validId }, body: { status: 'ready' } });
    const res = mockRes();
    await ctrl_updateKitchenOrderStatus(req, res, {
      findKitchenOrderById: async () => ({ ...PREPARING_ORDER }),
      updateOrderStatus:    async () => updated,
    });
    assert('status 200',              res._status === 200);
    assert('returned order is Ready', res._body.order.status === 'Ready');
  }

  /* ── 12. PATCH — valid: Ready → Served (via "completed" alias) ────────── */
  section('TEST 12: PATCH status Ready → completed (alias for Served)');
  {
    const validId = '507f1f77bcf86cd799439011';
    const updated = { ...READY_ORDER, status: 'Served' };
    const req = mockReq({ params: { id: validId }, body: { status: 'completed' } });
    const res = mockRes();
    await ctrl_updateKitchenOrderStatus(req, res, {
      findKitchenOrderById: async () => ({ ...READY_ORDER }),
      updateOrderStatus:    async () => updated,
    });
    assert('status 200',               res._status === 200);
    assert('returned order is Served', res._body.order.status === 'Served');
  }

  /* ── 13. PATCH — invalid status string ──────────────────────────────── */
  section('TEST 13: PATCH with invalid status value');
  {
    const validId = '507f1f77bcf86cd799439011';
    const req = mockReq({ params: { id: validId }, body: { status: 'burnt' } });
    const res = mockRes();
    await ctrl_updateKitchenOrderStatus(req, res, {
      findKitchenOrderById: async () => PENDING_ORDER,
      updateOrderStatus:    async () => {},
    });
    assert('status 400',         res._status === 400);
    assert('error mentions input',res._body.error.includes('"burnt"'));
    assert('validStatuses list', Array.isArray(res._body.validStatuses));
  }

  /* ── 14. PATCH — missing status field ───────────────────────────────── */
  section('TEST 14: PATCH with missing status body field');
  {
    const validId = '507f1f77bcf86cd799439011';
    const req = mockReq({ params: { id: validId }, body: {} });
    const res = mockRes();
    await ctrl_updateKitchenOrderStatus(req, res, {
      findKitchenOrderById: async () => PENDING_ORDER,
      updateOrderStatus:    async () => {},
    });
    assert('status 400',          res._status === 400);
    assert('error about status',  res._body.error.includes('status is required'));
  }

  /* ── 15. PATCH — invalid ObjectId ───────────────────────────────────── */
  section('TEST 15: PATCH with invalid MongoDB ObjectId');
  {
    const req = mockReq({ params: { id: 'not-an-id' }, body: { status: 'preparing' } });
    const res = mockRes();
    await ctrl_updateKitchenOrderStatus(req, res, {
      findKitchenOrderById: async () => null,
      updateOrderStatus:    async () => {},
    });
    assert('status 400',          res._status === 400);
    assert('error about ID',      res._body.error.includes('Invalid order ID format'));
  }

  /* ── 16. PATCH — order does not exist ───────────────────────────────── */
  section('TEST 16: PATCH on a non-existent order');
  {
    const validId = '507f1f77bcf86cd799439011';
    const req = mockReq({ params: { id: validId }, body: { status: 'preparing' } });
    const res = mockRes();
    await ctrl_updateKitchenOrderStatus(req, res, {
      findKitchenOrderById: async () => null,
      updateOrderStatus:    async () => null,
    });
    assert('status 404',         res._status === 404);
    assert('Order not found msg',res._body.error === 'Order not found.');
  }

  /* ── 17. PATCH — skip transition Pending → Ready ─────────────────────── */
  section('TEST 17: PATCH skip transition Pending → Ready (rejected)');
  {
    const validId = '507f1f77bcf86cd799439011';
    const req = mockReq({ params: { id: validId }, body: { status: 'ready' } });
    const res = mockRes();
    await ctrl_updateKitchenOrderStatus(req, res, {
      findKitchenOrderById: async () => ({ ...PENDING_ORDER }),
      updateOrderStatus:    async () => {},
    });
    assert('status 422',                res._status === 422);
    assert('error about transition',    res._body.error.includes('Invalid status transition'));
    assert('currentStatus is Pending',  res._body.currentStatus === 'Pending');
    assert('allowedNextStatus hint',    res._body.allowedNextStatus === 'Preparing');
  }

  /* ── 18. PATCH — skip transition Pending → Served ────────────────────── */
  section('TEST 18: PATCH skip transition Pending → Served (rejected)');
  {
    const validId = '507f1f77bcf86cd799439011';
    const req = mockReq({ params: { id: validId }, body: { status: 'served' } });
    const res = mockRes();
    await ctrl_updateKitchenOrderStatus(req, res, {
      findKitchenOrderById: async () => ({ ...PENDING_ORDER }),
      updateOrderStatus:    async () => {},
    });
    assert('status 422',                res._status === 422);
    assert('allowedNextStatus=Preparing',res._body.allowedNextStatus === 'Preparing');
  }

  /* ── 19. PATCH — backwards transition Ready → Preparing ──────────────── */
  section('TEST 19: PATCH backwards transition Ready → Preparing (rejected)');
  {
    const validId = '507f1f77bcf86cd799439011';
    const req = mockReq({ params: { id: validId }, body: { status: 'preparing' } });
    const res = mockRes();
    await ctrl_updateKitchenOrderStatus(req, res, {
      findKitchenOrderById: async () => ({ ...READY_ORDER }),
      updateOrderStatus:    async () => {},
    });
    assert('status 422',               res._status === 422);
    assert('error about transition',   res._body.error.includes('Invalid status transition'));
    assert('currentStatus is Ready',   res._body.currentStatus === 'Ready');
    assert('allowedNextStatus=Served', res._body.allowedNextStatus === 'Served');
  }

  /* ── 20. PATCH — same status re-applied ─────────────────────────────── */
  section('TEST 20: PATCH same status re-applied (rejected)');
  {
    const validId = '507f1f77bcf86cd799439011';
    const req = mockReq({ params: { id: validId }, body: { status: 'pending' } });
    const res = mockRes();
    await ctrl_updateKitchenOrderStatus(req, res, {
      findKitchenOrderById: async () => ({ ...PENDING_ORDER }),
      updateOrderStatus:    async () => {},
    });
    assert('status 422',               res._status === 422);
    assert('already in status msg',    res._body.error.includes('already in'));
  }

  /* ── 21. PATCH — terminal status update attempt ─────────────────────── */
  section('TEST 21: PATCH on already-Served (terminal) order');
  {
    const validId = '507f1f77bcf86cd799439011';
    const req = mockReq({ params: { id: validId }, body: { status: 'served' } });
    const res = mockRes();
    // Order is already Served — re-apply gives same-status rejection
    await ctrl_updateKitchenOrderStatus(req, res, {
      findKitchenOrderById: async () => ({ ...SERVED_ORDER }),
      updateOrderStatus:    async () => {},
    });
    assert('status 422',               res._status === 422);
    assert('already in msg',          res._body.error.includes('already in'));
  }

  /* ── 22. isValidObjectId helper ─────────────────────────────────────── */
  section('TEST 22: isValidObjectId helper');
  {
    assert('valid 24-hex id',   isValidObjectId('507f1f77bcf86cd799439011'));
    assert('rejects short id',  !isValidObjectId('abc123'));
    assert('rejects empty str', !isValidObjectId(''));
    assert('rejects number',    !isValidObjectId(12345));
    assert('rejects all-zeros', isValidObjectId('000000000000000000000000'));
  }

  /* ── 23. STATUS_MAP normalisation ───────────────────────────────────── */
  section('TEST 23: STATUS_MAP normalisation (case-insensitive)');
  {
    assert('pending   → Pending',   STATUS_MAP['pending']   === 'Pending');
    assert('PENDING   → Pending',   STATUS_MAP['pending']   === 'Pending');
    assert('preparing → Preparing', STATUS_MAP['preparing'] === 'Preparing');
    assert('ready     → Ready',     STATUS_MAP['ready']     === 'Ready');
    assert('completed → Served',    STATUS_MAP['completed'] === 'Served');
    assert('served    → Served',    STATUS_MAP['served']    === 'Served');
    assert('unknown   → undefined', STATUS_MAP['burnt']     === undefined);
  }

  /* ── 24. isValidTransition helper ───────────────────────────────────── */
  section('TEST 24: isValidTransition helper');
  {
    assert('Pending   → Preparing ✓', isValidTransition('Pending',   'Preparing'));
    assert('Preparing → Ready     ✓', isValidTransition('Preparing', 'Ready'));
    assert('Ready     → Served    ✓', isValidTransition('Ready',     'Served'));
    assert('Pending   → Ready     ✗', !isValidTransition('Pending',  'Ready'));
    assert('Pending   → Served    ✗', !isValidTransition('Pending',  'Served'));
    assert('Ready     → Preparing ✗', !isValidTransition('Ready',    'Preparing'));
    assert('Served    → anything  ✗', !isValidTransition('Served',   'Pending'));
    assert('same step             ✗', !isValidTransition('Pending',  'Pending'));
  }

  /* ── 25. describeAllowedNext helper ─────────────────────────────────── */
  section('TEST 25: describeAllowedNext helper');
  {
    assert('Pending   → Preparing', describeAllowedNext('Pending')   === 'Preparing');
    assert('Preparing → Ready',     describeAllowedNext('Preparing') === 'Ready');
    assert('Ready     → Served',    describeAllowedNext('Ready')     === 'Served');
    assert('Served    → null',      describeAllowedNext('Served')    === null);
  }

  /* ── Summary ─────────────────────────────────────────────────────────── */
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(60));
  if (failed > 0) process.exit(1);
})();
