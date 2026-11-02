/**
 * Order.js — Mongoose model for ServeSync (Member 2)
 *
 * Represents a customer's placed order.
 * Field names and status values are intentionally kept in sync with:
 *   - client/src/context/OrderContext.jsx  (frontend cart → order flow)
 *   - client/src/mocks/mockOrders.js        (Member 4 KDS data)
 *
 * Status lifecycle:  Pending → Preparing → Ready → Served
 */

const mongoose = require('mongoose');

/* ─── Sub-schema: one food item inside an order ─────────────────────────────
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
 * foodId is kept as a soft string reference so the order can optionally
 * be linked back to the Food document when it still exists.
 */
const orderItemSchema = new mongoose.Schema(
  {
    foodId: {
      type:     String,
      required: [true, 'foodId is required for each order item.'],
      trim:     true,
    },

    name: {
      type:     String,
      required: [true, 'Item name is required.'],
      trim:     true,
    },

    price: {
      type:     Number,
      required: [true, 'Item price is required.'],
      min:      [0, 'Item price cannot be negative.'],
    },

    quantity: {
      type:     Number,
      required: [true, 'Item quantity is required.'],
      min:      [1, 'Quantity must be at least 1.'],
    },
  },
  { _id: false } // no separate _id for sub-documents — keeps response clean
);

/* ─── Main Order schema ──────────────────────────────────────────────────── */
const orderSchema = new mongoose.Schema(
  {
    tableNumber: {
      type:     Number,
      required: [true, 'Table number is required.'],
      min:      [1, 'Table number must be at least 1.'],
    },

    items: {
      type:     [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message:   'An order must contain at least one item.',
      },
    },

    totalAmount: {
      type:     Number,
      required: [true, 'Total amount is required.'],
      min:      [0, 'Total amount cannot be negative.'],
    },

    status: {
      type:    String,
      enum:    {
        values:  ['Pending', 'Preparing', 'Ready', 'Served'],
        message: '{VALUE} is not a valid order status.',
      },
      default: 'Pending',
    },

    specialInstructions: {
      type:      String,
      default:   null,
      trim:      true,
      maxlength: [500, 'Special instructions cannot exceed 500 characters.'],
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields (both ISO Date).
    // createdAt is used by the Kitchen Dashboard to show elapsed time.
    timestamps: true,
  }
);

module.exports = mongoose.model('Order', orderSchema);
