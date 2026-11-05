'use strict';

/**
 * kitchenRepository.js — ServeSync (Member 4)
 *
 * All MongoDB read/update operations needed by the Kitchen Dashboard.
 * Works with the SAME `orders` collection that Member 2 writes to —
 * do NOT create a separate collection.
 *
 * Uses the shared connection from Member 1's db.js via getDB().
 */

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

/** @returns {import('mongodb').Collection} */
function ordersCollection() {
  return getDB().collection('orders');
}

/**
 * findAllKitchenOrders — returns ALL orders sorted newest-first.
 * The kitchen dashboard uses this to see every pending / in-progress order.
 *
 * @returns {Promise<object[]>}
 */
async function findAllKitchenOrders() {
  return ordersCollection()
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * findOrdersByStatus — returns orders that match the given canonical status,
 * sorted newest-first.
 *
 * @param {string} canonicalStatus  Title-case status string stored in MongoDB
 *                                  (e.g. 'Pending', 'Preparing', 'Ready', 'Served').
 * @returns {Promise<object[]>}
 */
async function findOrdersByStatus(canonicalStatus) {
  return ordersCollection()
    .find({ status: canonicalStatus })
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * findKitchenOrderById — fetches a single order document by ObjectId.
 *
 * @param {string} id  24-hex-char ObjectId string.
 * @returns {Promise<object|null>}
 */
async function findKitchenOrderById(id) {
  return ordersCollection().findOne({ _id: new ObjectId(id) });
}

/**
 * updateOrderStatus — patches the `status` (and `updatedAt`) field of an
 * existing order.  All other fields are preserved untouched.
 *
 * @param {string} id      24-hex-char ObjectId string.
 * @param {string} status  One of KITCHEN_STATUSES.
 * @returns {Promise<object|null>}  The updated document, or null if not found.
 */
async function updateOrderStatus(id, status) {
  const result = await ordersCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  // MongoDB driver v5+ returns the document directly (not result.value)
  // but older v4 / v7 shapes vary.  Handle both gracefully.
  if (result && result._id) {
    return result;          // driver v5+
  }
  return result?.value ?? null;  // driver v4 fallback
}

module.exports = {
  findAllKitchenOrders,
  findOrdersByStatus,
  findKitchenOrderById,
  updateOrderStatus,
};
