'use strict';

/**
 * orderRepository.js — ServeSync (Member 2)
 *
 * All MongoDB operations for the `orders` collection.
 * Uses the shared database connection provided by db.js via getDB().
 *
 * Design decisions:
 *  - getDB() is called inside each function (not at module load time) so
 *    these functions are only invoked after connectDB() has run in server.js.
 *  - findOrderById wraps ObjectId construction in a try/catch — if for any
 *    reason an invalid id string slips past the controller's isValidObjectId
 *    check, the BSON error is caught and surfaced as null (not found) rather
 *    than crashing the request.
 *  - findOrdersByTableNumber uses an $or query to match both numeric and
 *    string representations, which makes it resilient to documents seeded
 *    before tableNumber was always stored as a Number.
 *  - All list queries are sorted { createdAt: -1 } (newest first) for
 *    consistency with what the Kitchen Dashboard and Admin API expect.
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
 * The caller is responsible for constructing a fully-validated document
 * (including timestamps and status) before passing it here.
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
 * Returns null if the id is not a valid ObjectId string or no document
 * is found, so callers can treat both cases uniformly as "not found".
 *
 * @param {string} id  A 24-character hex ObjectId string.
 * @returns {Promise<object|null>}
 */
async function findOrderById(id) {
  let oid;
  try {
    oid = new ObjectId(id);
  } catch {
    // Malformed id — treat as not found rather than propagating a BSONError
    return null;
  }
  return ordersCollection().findOne({ _id: oid });
}

/**
 * findAllOrders — returns all orders sorted newest-first.
 *
 * Returns an empty array when the collection has no documents.
 *
 * @returns {Promise<object[]>}
 */
async function findAllOrders() {
  return ordersCollection().find({}).sort({ createdAt: -1 }).toArray();
}

/**
 * findOrdersByTableNumber — returns all orders for a specific table, newest-first.
 *
 * Uses an $or query to match both numeric (Number) and string representations
 * of tableNumber.  This keeps the query correct for documents seeded before
 * tableNumber was always stored as a Number, while still returning all orders
 * inserted by the current order controller (which always stores it as Number).
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
