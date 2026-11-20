'use strict';


const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

function foodsCollection() {
  return getDB().collection('foods');
}


async function findAllFoods(category) {
  const query = category ? { category } : {};
  return foodsCollection()
    .find(query)
    .sort({ category: 1, name: 1 })
    .toArray();
}

async function findFoodById(id) {
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }
  return foodsCollection().findOne({ _id: objectId });
}


async function insertFood(foodDoc) {
  return foodsCollection().insertOne(foodDoc);
}

async function updateFoodById(id, fields) {
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }

  const result = await foodsCollection().findOneAndUpdate(
    { _id: objectId },
    { $set: { ...fields, updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  if (result && result._id) {
    return result;
  }
  return result?.value ?? null;
}

async function deleteFoodById(id) {
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return { acknowledged: false, deletedCount: 0 };
  }
  return foodsCollection().deleteOne({ _id: objectId });
}

module.exports = {
  findAllFoods,
  findFoodById,
  insertFood,
  updateFoodById,
  deleteFoodById,
};
