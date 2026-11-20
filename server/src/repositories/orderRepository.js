'use strict';


const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

function ordersCollection() {
  return getDB().collection('orders');
}

async function insertOrder(orderDoc) {
  return ordersCollection().insertOne(orderDoc);
}

async function findOrderById(id) {
  let oid;
  try {
    oid = new ObjectId(id);
  } catch {
    return null;
  }
  return ordersCollection().findOne({ _id: oid });
}

async function findAllOrders() {
  return ordersCollection().find({}).sort({ createdAt: -1 }).toArray();
}

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
