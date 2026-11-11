'use strict';

/**
 * Order.js — Native MongoDB model helpers for ServeSync (Member 2)
 *
 * Represents a customer's placed order.
 * Field names and status values are intentionally kept in sync with:
 *   - client/src/context/OrderContext.jsx  (frontend cart → order flow)
 *   - client/src/mocks/mockOrders.js        (Member 4 KDS data)
 *
 * Status lifecycle:  Pending → Preparing → Ready → Served
 *
 * This file no longer uses Mongoose.  It uses the official MongoDB Node.js
 * Driver via the shared connection exported from src/config/db.js.
 */

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

/* ─── Constants ──────────────────────────────────────────────────────────── */

/** Valid order-status values (mirrors the former Mongoose enum). */
const ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Served'];

/** Maximum length allowed for specialInstructions (mirrors former maxlength). */
const MAX_SPECIAL_INSTRUCTIONS_LENGTH = 500;

/* ─── Validation helpers ─────────────────────────────────────────────────── */

/**
 * validateOrderItem — checks a single order-item object for required fields
 * and range constraints (mirrors the former orderItemSchema rules).
 *
 * Why snapshot name and price here instead of referencing the Food document?
 *
 *  1. Menu prices can change after an order is placed.  Storing the price
 *     at order time means historical totals stay accurate forever.
 *  2. A food item can be deleted from the menu.  A hard ref would break;
 *     a snapshot always shows what the customer originally ordered.
 *  3. The kitchen only needs the name and quantity — it never needs to
 *     join back to the Food collection at read time.
 *
 * foodId is kept as a soft string/ObjectId reference so the order can
 * optionally be linked back to the Food document when it still exists.
 *
 * @param {object} item
 * @param {number} index  Position in the items array (for error messages).
 * @returns {{ valid: true } | { valid: false, message: string }}
 */
function validateOrderItem(item, index) {
  if (!item || typeof item !== 'object') {
    return { valid: false, message: `items[${index}] must be an object.` };
  }

  // foodId — required, non-empty string
  if (!item.foodId || String(item.foodId).trim() === '') {
    return {
      valid: false,
      message: `items[${index}].foodId is required for each order item.`,
    };
  }

  // name — required, non-empty string
  if (!item.name || String(item.name).trim() === '') {
    return { valid: false, message: `items[${index}].name: Item name is required.` };
  }

  // price — required number >= 0
  if (item.price === undefined || item.price === null || typeof item.price !== 'number') {
    return { valid: false, message: `items[${index}].price: Item price is required.` };
  }
  if (item.price < 0) {
    return { valid: false, message: `items[${index}].price: Item price cannot be negative.` };
  }

  // quantity — required number >= 1
  if (
    item.quantity === undefined ||
    item.quantity === null ||
    typeof item.quantity !== 'number'
  ) {
    return { valid: false, message: `items[${index}].quantity: Item quantity is required.` };
  }
  if (item.quantity < 1) {
    return {
      valid: false,
      message: `items[${index}].quantity: Quantity must be at least 1.`,
    };
  }

  return { valid: true };
}

/**
 * validateOrderDoc — validates a full order document before insertion.
 * Mirrors every constraint that was declared in the former Mongoose schema.
 *
 * @param {object} doc
 * @returns {{ valid: true } | { valid: false, message: string }}
 */
function validateOrderDoc(doc) {
  if (!doc || typeof doc !== 'object') {
    return { valid: false, message: 'Order document must be an object.' };
  }

  // tableNumber — required, >= 1
  if (doc.tableNumber === undefined || doc.tableNumber === null) {
    return { valid: false, message: 'Table number is required.' };
  }
  if (typeof doc.tableNumber !== 'number' || doc.tableNumber < 1) {
    return { valid: false, message: 'Table number must be at least 1.' };
  }

  // items — required, non-empty array
  if (!Array.isArray(doc.items) || doc.items.length === 0) {
    return { valid: false, message: 'An order must contain at least one item.' };
  }
  for (let i = 0; i < doc.items.length; i++) {
    const itemResult = validateOrderItem(doc.items[i], i);
    if (!itemResult.valid) return itemResult;
  }

  // totalAmount — required, >= 0
  if (doc.totalAmount === undefined || doc.totalAmount === null) {
    return { valid: false, message: 'Total amount is required.' };
  }
  if (typeof doc.totalAmount !== 'number' || doc.totalAmount < 0) {
    return { valid: false, message: 'Total amount cannot be negative.' };
  }

  // status — optional, must be one of the allowed values if provided
  if (doc.status !== undefined) {
    if (!ORDER_STATUSES.includes(doc.status)) {
      return {
        valid: false,
        message: `${doc.status} is not a valid order status.`,
      };
    }
  }

  // specialInstructions — optional, max 500 chars if provided
  if (doc.specialInstructions !== undefined && doc.specialInstructions !== null) {
    if (String(doc.specialInstructions).length > MAX_SPECIAL_INSTRUCTIONS_LENGTH) {
      return {
        valid: false,
        message: 'Special instructions cannot exceed 500 characters.',
      };
    }
  }

  return { valid: true };
}

/* ─── Collection accessor ────────────────────────────────────────────────── */

/**
 * Returns the native MongoDB `orders` collection from the shared connection.
 * Must only be called after connectDB() has run in server.js.
 *
 * @returns {import('mongodb').Collection}
 */
function getOrdersCollection() {
  return getDB().collection('orders');
}

/* ─── Document builder ───────────────────────────────────────────────────── */

/**
 * buildOrderDoc — constructs a clean order document ready for insertion.
 *
 * Applies the same defaults that the former Mongoose schema provided:
 *   - status defaults to 'Pending'
 *   - specialInstructions defaults to null
 *   - createdAt / updatedAt are set explicitly (mirrors `timestamps: true`)
 *
 * @param {object} fields  Raw order fields.
 * @returns {object}  A plain object suitable for insertOne().
 */
function buildOrderDoc(fields) {
  const now = new Date();
  const totalAmount =
    typeof fields.totalAmount === 'number' ? fields.totalAmount : 0;
  return {
    tableNumber: fields.tableNumber,
    items: fields.items,
    totalAmount,
    total: totalAmount,  // alias kept for frontend (OrderCard) and KDS compatibility
    status: fields.status ?? 'Pending',
    specialInstructions:
      fields.specialInstructions !== undefined ? fields.specialInstructions : null,
    createdAt: fields.createdAt ?? now,
    updatedAt: fields.updatedAt ?? now,
  };
}

/* ─── Exports ────────────────────────────────────────────────────────────── */

module.exports = {
  /** The allowed status values — use instead of hard-coding strings. */
  ORDER_STATUSES,

  /** Maximum character length for specialInstructions. */
  MAX_SPECIAL_INSTRUCTIONS_LENGTH,

  /** Validate a single item sub-document. */
  validateOrderItem,

  /** Validate a full order document. */
  validateOrderDoc,

  /** Get the live `orders` MongoDB collection. */
  getOrdersCollection,

  /** Build a well-formed order document with defaults applied. */
  buildOrderDoc,

  /**
   * ObjectId re-exported for convenience so callers that currently
   * import from 'Order.js' don't need an extra require('mongodb').
   */
  ObjectId,
};
