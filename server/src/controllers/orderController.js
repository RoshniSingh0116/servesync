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
 *  - The initial order status is 'Pending' (title-case) to match the
 *    status values used by the Kitchen Dashboard (Member 4) and the
 *    frontend ORDER_STATUSES constants.
 *  - createdAt is set explicitly so the repository's sort order works
 *    even if the environment's system clock is adjusted later.
 */

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');
const {
  insertOrder,
  findOrderById,
  findAllOrders,
  findOrdersByTableNumber,
} = require('../repositories/orderRepository');

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/**
 * Returns true if the given string is a valid 24-hex-char MongoDB ObjectId.
 * @param {string} id
 */
function isValidObjectId(id) {
  return typeof id === 'string' && ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}

/* ─── POST /api/orders ─────────────────────────────────────────────────────── */

/**
 * placeOrder — validates the request, enriches items from the foods
 * collection, calculates the server-side total, and persists the order.
 */
async function placeOrder(req, res) {
  try {
    /* ── 0. Validate request body ── */
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
      return res
        .status(400)
        .json({ error: 'tableNumber must be a positive integer.' });
    }

    /* ── 2. Validate items array ── */
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: 'items must be a non-empty array.' });
    }

    /* ── 3 & 4. Validate individual item fields ── */
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return res.status(400).json({
          error: `items[${i}] must be an object.`,
        });
      }

      if (!item.foodId || !isValidObjectId(String(item.foodId))) {
        return res.status(400).json({
          error: `items[${i}].foodId is missing or not a valid MongoDB ObjectId.`,
        });
      }

      const qty = item.quantity;
      if (qty === undefined || qty === null || !Number.isInteger(Number(qty)) || Number(qty) < 1) {
        return res.status(400).json({
          error: `items[${i}].quantity must be a positive integer.`,
        });
      }
    }

    /* ── 5. Fetch food documents from the shared `foods` collection ── */
    const db = getDB();
    const foodsCollection = db.collection('foods');

    // Deduplicate food IDs for query to handle any repeated items safely
    const uniqueFoodIds = [...new Set(items.map((item) => String(item.foodId)))];
    const foodObjectIds = uniqueFoodIds.map((id) => new ObjectId(id));

    const foodDocs = await foodsCollection
      .find({ _id: { $in: foodObjectIds } })
      .toArray();

    /* ── 6. Verify every food item exists ── */
    if (foodDocs.length !== uniqueFoodIds.length) {
      const foundIds = new Set(foodDocs.map((f) => String(f._id)));
      const missing = uniqueFoodIds.filter((id) => !foundIds.has(id));
      return res.status(404).json({
        error: `The following food item(s) do not exist: ${missing.join(', ')}`,
      });
    }

    /* Build a lookup map: ObjectId string → food document */
    const foodMap = {};
    foodDocs.forEach((f) => {
      foodMap[String(f._id)] = f;
    });

    /* ── 7. Verify availability ── */
    // The foods collection may use `isAvailable` (boolean) to mark items
    // that are currently offered. If the field is absent (older documents
    // seeded without it), the item is treated as available.
    for (let i = 0; i < items.length; i++) {
      const food = foodMap[String(items[i].foodId)];
      if (food.isAvailable === false) {
        return res.status(400).json({
          error: `"${food.name}" is currently unavailable.`,
        });
      }
    }

    /* ── 8 & 9. Read prices from MongoDB and build enriched items ── */
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

    /* ── 10. Calculate the server-side total ── */
    const totalAmount = enrichedItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    /* ── 11. Build and save the order document ── */
    const now = new Date();
    const orderDoc = {
      tableNumber: parsedTable,
      items: enrichedItems,
      totalAmount,
      total: totalAmount, // For frontend compatibility (OrderCard, KDS)
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    if (specialInstructions && typeof specialInstructions === 'string' && specialInstructions.trim()) {
      orderDoc.specialInstructions = specialInstructions.trim();
    }

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
 * Used by both Member 2's confirmation flow and Member 4's Kitchen Dashboard.
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
 * getOrdersByTable — returns all orders for a specific table number, newest-first.
 * Useful for showing a customer or staff member all orders placed at a table.
 */
async function getOrdersByTable(req, res) {
  try {
    const { tableNumber } = req.params;

    /* Validate tableNumber — must be a positive integer */
    const parsed = Number(tableNumber);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return res.status(400).json({
        error: 'tableNumber must be a positive integer.',
      });
    }

    const orders = await findOrdersByTableNumber(parsed);

    return res.status(200).json({ tableNumber: parsed, count: orders.length, orders });
  } catch (err) {
    console.error('[getOrdersByTable] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch orders for table. Please try again.' });
  }
}

module.exports = { placeOrder, getOrderById, getAllOrders, getOrdersByTable };
