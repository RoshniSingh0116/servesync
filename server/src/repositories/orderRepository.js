'use strict';

/**
 * orderRepository.js — ServeSync (Member 2)
 *
 * All MongoDB operations for the `orders` collection.
 * Uses the shared database connection provided by Member 1's db.js.
 *
 * Call getDB() inside each function so that these functions are only
 * invoked after connectDB() has already run in server.js.
 */

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

/** @returns {import('mongodb').Collection} */
function ordersCollection() {
  return getDB().collection('orders');
}

/**
 * insertOrder — persists a new order document.
 *
 * @param {object} orderDoc  Fully-formed order object (no _id — MongoDB generates it).
 * @returns {Promise<import('mongodb').InsertOneResult>}
 */
async function insertOrder(orderDoc) {
  return ordersCollection().insertOne(orderDoc);
}

/**
 * findOrderById — fetches a single order by its ObjectId string.
 *
 * @param {string} id  A 24-character hex ObjectId string.
 * @returns {Promise<object|null>}
 */
async function findOrderById(id) {
  return ordersCollection().findOne({ _id: new ObjectId(id) });
}

/**
 * findAllOrders — returns all orders sorted newest-first.
 *
 * @returns {Promise<object[]>}
 */
async function findAllOrders() {
  return ordersCollection().find({}).sort({ createdAt: -1 }).toArray();
}

/**
 * findOrdersByTableNumber — returns all orders for a specific table, newest-first.
 * Handles both numeric and string representations of tableNumber in MongoDB.
 *
 * @param {number|string} tableNumber  The table number to filter by.
 * @returns {Promise<object[]>}
 */
async function findOrdersByTableNumber(tableNumber) {
  const num = Number(tableNumber);
  return ordersCollection()
    .find({
      $or: [
        { tableNumber: num },
        { tableNumber: String(tableNumber) },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray();
}

module.exports = { insertOrder, findOrderById, findAllOrders, findOrdersByTableNumber };
