'use strict';


const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

function ordersCollection() {
  return getDB().collection('orders');
}

async function findAllKitchenOrders() {
  return ordersCollection()
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
}

async function findOrdersByStatus(canonicalStatus) {
  return ordersCollection()
    .find({ status: canonicalStatus })
    .sort({ createdAt: -1 })
    .toArray();
}

async function findKitchenOrderById(id) {
  return ordersCollection().findOne({ _id: new ObjectId(id) });
}

async function updateOrderStatus(id, status) {
  const result = await ordersCollection().findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  if (result && result._id) {
    return result;
  }
  return result?.value ?? null;
}

module.exports = {
  findAllKitchenOrders,
  findOrdersByStatus,
  findKitchenOrderById,
  updateOrderStatus,
};
