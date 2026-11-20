'use strict';


const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');


const ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Served'];

const MAX_SPECIAL_INSTRUCTIONS_LENGTH = 500;


function validateOrderItem(item, index) {
  if (!item || typeof item !== 'object') {
    return { valid: false, message: `items[${index}] must be an object.` };
  }

  if (!item.foodId || String(item.foodId).trim() === '') {
    return {
      valid: false,
      message: `items[${index}].foodId is required for each order item.`,
    };
  }

  if (!item.name || String(item.name).trim() === '') {
    return { valid: false, message: `items[${index}].name: Item name is required.` };
  }

  if (item.price === undefined || item.price === null || typeof item.price !== 'number') {
    return { valid: false, message: `items[${index}].price: Item price is required.` };
  }
  if (item.price < 0) {
    return { valid: false, message: `items[${index}].price: Item price cannot be negative.` };
  }

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

function validateOrderDoc(doc) {
  if (!doc || typeof doc !== 'object') {
    return { valid: false, message: 'Order document must be an object.' };
  }

  if (doc.tableNumber === undefined || doc.tableNumber === null) {
    return { valid: false, message: 'Table number is required.' };
  }
  if (typeof doc.tableNumber !== 'number' || doc.tableNumber < 1) {
    return { valid: false, message: 'Table number must be at least 1.' };
  }

  if (!Array.isArray(doc.items) || doc.items.length === 0) {
    return { valid: false, message: 'An order must contain at least one item.' };
  }
  for (let i = 0; i < doc.items.length; i++) {
    const itemResult = validateOrderItem(doc.items[i], i);
    if (!itemResult.valid) return itemResult;
  }

  if (doc.totalAmount === undefined || doc.totalAmount === null) {
    return { valid: false, message: 'Total amount is required.' };
  }
  if (typeof doc.totalAmount !== 'number' || doc.totalAmount < 0) {
    return { valid: false, message: 'Total amount cannot be negative.' };
  }

  if (doc.status !== undefined) {
    if (!ORDER_STATUSES.includes(doc.status)) {
      return {
        valid: false,
        message: `${doc.status} is not a valid order status.`,
      };
    }
  }

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


function getOrdersCollection() {
  return getDB().collection('orders');
}


function buildOrderDoc(fields) {
  const now = new Date();
  const totalAmount =
    typeof fields.totalAmount === 'number' ? fields.totalAmount : 0;
  return {
    tableNumber: fields.tableNumber,
    items: fields.items,
    totalAmount,
    total: totalAmount,
    status: fields.status ?? 'Pending',
    specialInstructions:
      fields.specialInstructions !== undefined ? fields.specialInstructions : null,
    createdAt: fields.createdAt ?? now,
    updatedAt: fields.updatedAt ?? now,
  };
}


module.exports = {
  ORDER_STATUSES,

  MAX_SPECIAL_INSTRUCTIONS_LENGTH,

  validateOrderItem,

  validateOrderDoc,

  getOrdersCollection,

  buildOrderDoc,

  ObjectId,
};
