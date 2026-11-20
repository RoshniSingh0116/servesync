'use strict';


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


function isValidObjectId(id) {
  return typeof id === 'string' && ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}


async function placeOrder(req, res) {
  try {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Invalid request body. Expected a JSON object.' });
    }

    const { tableNumber, items, specialInstructions } = req.body;

    if (tableNumber === undefined || tableNumber === null || tableNumber === '') {
      return res.status(400).json({ error: 'tableNumber is required.' });
    }
    const parsedTable = Number(tableNumber);
    if (!Number.isInteger(parsedTable) || parsedTable < 1) {
      return res.status(400).json({ error: 'tableNumber must be a positive integer.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items must be a non-empty array.' });
    }

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

    if (
      specialInstructions !== undefined &&
      specialInstructions !== null &&
      String(specialInstructions).length > MAX_SPECIAL_INSTRUCTIONS_LENGTH
    ) {
      return res.status(400).json({
        error: `specialInstructions cannot exceed ${MAX_SPECIAL_INSTRUCTIONS_LENGTH} characters.`,
      });
    }

    const db = getDB();
    const foodsCollection = db.collection('foods');

    const uniqueFoodIds = [...new Set(items.map((item) => String(item.foodId)))];
    const foodObjectIds = uniqueFoodIds.map((id) => new ObjectId(id));

    const foodDocs = await foodsCollection
      .find({ _id: { $in: foodObjectIds } })
      .toArray();

    if (foodDocs.length !== uniqueFoodIds.length) {
      const foundIds = new Set(foodDocs.map((f) => String(f._id)));
      const missing = uniqueFoodIds.filter((id) => !foundIds.has(id));
      return res.status(404).json({
        error: `The following food item(s) do not exist: ${missing.join(', ')}`,
      });
    }

    const foodMap = {};
    foodDocs.forEach((f) => {
      foodMap[String(f._id)] = f;
    });

    for (let i = 0; i < items.length; i++) {
      const food = foodMap[String(items[i].foodId)];
      if (food.isAvailable === false) {
        return res.status(400).json({
          error: `"${food.name}" is currently unavailable.`,
        });
      }
    }

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

    const totalAmount = enrichedItems.reduce((sum, item) => sum + item.subtotal, 0);

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

    const validation = validateOrderDoc(orderDoc);
    if (!validation.valid) {
      console.error('[placeOrder] Document failed pre-insert validation:', validation.message);
      return res.status(500).json({ error: 'Failed to construct a valid order document.' });
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


async function getAllOrders(req, res) {
  try {
    const orders = await findAllOrders();
    return res.status(200).json({ count: orders.length, orders });
  } catch (err) {
    console.error('[getAllOrders] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch orders. Please try again.' });
  }
}


async function getOrdersByTable(req, res) {
  try {
    const { tableNumber } = req.params;

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
