'use strict';

/**
 * orderController.js — ServeSync (Member 2)
 *
 * Express controller functions for the Order API.
 *
 * Design decisions:
 *  - Prices are NEVER trusted from the frontend.  The backend fetches
 *    the current price from the `foods` collection and calculates totals.
 *  - foodId values arriving as strings are converted to ObjectId before
 *    querying and before storing in the order document.
 *  - The initial order status is 'Pending' (Title-case) to match the
 *    status values used by the Kitchen Dashboard (Member 4) and the
 *    frontend ORDER_STATUSES constants.
 *  - createdAt is set explicitly so the repository's sort order works
 *    even if the environment's system clock is adjusted later.
 *  - buildOrderDoc() and validateOrderDoc() from Order.js are used as a
 *    second-layer safety net before every insert, so the shape written to
 *    MongoDB is always consistent regardless of which code path called it.
 *  - specialInstructions is capped at MAX_SPECIAL_INSTRUCTIONS_LENGTH (500)
 *    characters, matching the constraint in Order.js.
 */

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const {
  insertOrder,
  findOrderById,
  findAllOrders,
  findOrdersByTableNumber,
} = require('../repositories/orderRepository');
const {
  validateOrderDoc,
  buildOrderDoc,
  MAX_SPECIAL_INSTRUCTIONS_LENGTH,
} = require('../models/Order');

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Returns true if the given string is a valid 24-hex-char MongoDB ObjectId.
 *
 * ObjectId.isValid() alone is too permissive — it also accepts 12-byte
 * strings.  Round-tripping through the constructor confirms the input is
 * exactly a 24-character lowercase hex string.
 *
 * @param {string} id
 */
function isValidObjectId(id) {
  return typeof id === 'string' && ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

/* ─── POST /api/orders ─────────────────────────────────────────────────────── */

/**
 * placeOrder — validates the request, enriches items from the foods
 * collection, calculates the server-side total, and persists the order.
 *
 * Validation steps:
 *  1. Request body must be a non-array object.
 *  2. tableNumber must be a positive integer.
 *  3. items must be a non-empty array.
 *  4. Each item must be an object with a valid foodId ObjectId string.
 *  5. Each item quantity must be a positive integer.
 *  6. specialInstructions (if provided) must not exceed 500 characters.
 *  7. All referenced food documents must exist in the `foods` collection.
 *  8. All referenced food items must be marked as available (isAvailable !== false).
 *  9. Prices are read from MongoDB — never from the request body.
 * 10. The order total is computed on the server.
 * 11. The final document is validated by validateOrderDoc() before insertion.
 */
async function placeOrder(req, res) {
  try {
    /* ── 0. Validate request body shape ── */
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid request body. Expected a JSON object.' });
    }

    const { tableNumber, items, specialInstructions } = req.body;

    /* ── 1. Validate tableNumber ── */
    if (tableNumber === undefined || tableNumber === null || tableNumber === '') {
      return res.status(400).json({ error: 'tableNumber is required.' });
    }
    const parsedTable = Number(tableNumber);
    if (!Number.isInteger(parsedTable) || parsedTable < 1) {
      return res.status(400).json({ error: 'tableNumber must be a positive integer.' });
    }

    /* ── 2. Validate items array ── */
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array.' });
    }

    /* ── 3 & 4. Validate individual item fields ── */
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return res.status(400).json({ error: `items[${i}] must be an object.` });
      }

      if (!item.foodId || !isValidObjectId(String(item.foodId))) {
        return res.status(400).json({
          error: `items[${i}].foodId is missing or not a valid MongoDB ObjectId.`,
        });
      }

      const qty = item.quantity;
      if (
        qty === undefined ||
        qty === null ||
        !Number.isInteger(Number(qty)) ||
        Number(qty) < 1
      ) {
        return res.status(400).json({
          error: `items[${i}].quantity must be a positive integer.`,
        });
      }
    }

    /* ── 5. Validate specialInstructions length (if provided) ── */
    if (
      specialInstructions !== undefined &&
      specialInstructions !== null &&
      String(specialInstructions).length > MAX_SPECIAL_INSTRUCTIONS_LENGTH
    ) {
      return res.status(400).json({
        error: `specialInstructions cannot exceed ${MAX_SPECIAL_INSTRUCTIONS_LENGTH} characters.`,
      });
    }

    /* ── 6. Fetch food documents from the shared `foods` collection ── */
    const db = getDB();
    const foodsCollection = db.collection('foods');

    // Deduplicate food IDs before querying — handles duplicate items in cart safely
    const uniqueFoodIds = [...new Set(items.map((item) => String(item.foodId)))];
    const foodObjectIds = uniqueFoodIds.map((id) => new ObjectId(id));

    const foodDocs = await foodsCollection
      .find({ _id: { $in: foodObjectIds } })
      .toArray();

    /* ── 7. Verify every referenced food item exists ── */
    if (foodDocs.length !== uniqueFoodIds.length) {
      const foundIds = new Set(foodDocs.map((f) => String(f._id)));
      const missing = uniqueFoodIds.filter((id) => !foundIds.has(id));
      return res.status(404).json({
        error: `The following food item(s) do not exist: ${missing.join(', ')}`,
      });
    }

    // Build a lookup map: ObjectId string → food document
    const foodMap = {};
    foodDocs.forEach((f) => {
      foodMap[String(f._id)] = f;
    });

    /* ── 8. Verify food availability ── */
    // The foods collection uses `isAvailable` (boolean) to mark active items.
    // If the field is absent (older documents seeded without it), the item is
    // treated as available to avoid breaking backwards compatibility.
    for (let i = 0; i < items.length; i++) {
      const food = foodMap[String(items[i].foodId)];
      if (food.isAvailable === false) {
        return res.status(400).json({
          error: `"${food.name}" is currently unavailable.`,
        });
      }
    }

    /* ── 9. Read prices from MongoDB and build enriched item sub-documents ── */
    // Prices are always taken from the database, never from req.body.
    // Each item snapshot includes: foodId, name, price, quantity, subtotal.
    // Storing name and price at order-time means historical totals remain
    // accurate even if the menu price changes or the food item is deleted later.
    const enrichedItems = items.map((item) => {
      const food = foodMap[String(item.foodId)];
      const price = Number(food.price);
      const quantity = Number(item.quantity);
      const subtotal = price * quantity;
      return {
        foodId: new ObjectId(String(item.foodId)),
        name: food.name,
        price,
        quantity,
        subtotal,
      };
    });

    /* ── 10. Calculate the server-side order total ── */
    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);

    /* ── 11. Build the order document via the shared helper ── */
    // buildOrderDoc applies defaults (status = 'Pending', timestamps, etc.)
    // and ensures the document shape is consistent with what Kitchen and Admin
    // APIs expect when reading from the `orders` collection.
    const orderDoc = buildOrderDoc({
      tableNumber: parsedTable,
      items: enrichedItems,
      totalAmount,
      status: 'Pending',
      specialInstructions:
        specialInstructions && String(specialInstructions).trim()
          ? String(specialInstructions).trim()
          : null,
    });

    /* ── 12. Second-layer validation before insert ── */
    const validation = validateOrderDoc(orderDoc);
    if (!validation.valid) {
      // This should never happen in normal flow — it catches edge cases
      // where the document builder produced something unexpected.
      console.error('[placeOrder] Document failed pre-insert validation:', validation.message);
      return res.status(500).json({ error: 'Failed to construct a valid order document.' });
    }

    /* ── 13. Persist the order ── */
    const result = await insertOrder(orderDoc);

    return res.status(201).json({
      message: 'Order placed successfully.',
      order: {
        _id: result.insertedId,
        ...orderDoc,
      },
    });
  } catch (err) {
    console.error('[placeOrder] Error:', err.message);
    return res.status(500).json({ error: 'Failed to place order. Please try again.' });
  }
}

/* ─── GET /api/orders/:id ─────────────────────────────────────────────────── */

/**
 * getOrderById — fetches a single order by its MongoDB ObjectId.
 *
 * Returns 400 for a malformed ID, 404 when no matching order exists,
 * and 200 with the order document on success.
 */
async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid order ID format.' });
    }

    const order = await findOrderById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    return res.status(200).json({ order });
  } catch (err) {
    console.error('[getOrderById] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch order. Please try again.' });
  }
}

/* ─── GET /api/orders ─────────────────────────────────────────────────────── */

/**
 * getAllOrders — returns all orders sorted newest-first.
 *
 * Used by Member 2's order-confirmation flow, Member 3's Admin Dashboard,
 * and Member 4's Kitchen Dashboard.  Returns an empty array (not 404) when
 * no orders exist — an empty kitchen is a valid, normal state.
 */
async function getAllOrders(req, res) {
  try {
    const orders = await findAllOrders();
    return res.status(200).json({ count: orders.length, orders });
  } catch (err) {
    console.error('[getAllOrders] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch orders. Please try again.' });
  }
}

/* ─── GET /api/orders/table/:tableNumber ──────────────────────────────────── */

/**
 * getOrdersByTable — returns all orders for a specific table, newest-first.
 *
 * Useful for displaying a customer's or staff member's history at a given
 * table.  Returns an empty array (not 404) when the table has no orders.
 *
 * tableNumber must be a positive integer; non-integer or negative values
 * are rejected with 400.
 */
async function getOrdersByTable(req, res) {
  try {
    const { tableNumber } = req.params;

    // tableNumber comes in as a string from the URL — parse and validate it.
    const parsed = Number(tableNumber);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return res.status(400).json({ error: 'tableNumber must be a positive integer.' });
    }

    const orders = await findOrdersByTableNumber(parsed);

    return res.status(200).json({ tableNumber: parsed, count: orders.length, orders });
  } catch (err) {
    console.error('[getOrdersByTable] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch orders for table. Please try again.' });
  }
}

module.exports = { placeOrder, getOrderById, getAllOrders, getOrdersByTable };
