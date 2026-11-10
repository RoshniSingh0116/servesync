'use strict';

/**
 * foodRepository.js — ServeSync (Member 1)
 *
 * All MongoDB operations for the `foods` collection.
 * Uses the shared database connection provided by db.js via getDB().
 *
 * Design decisions:
 *  - getDB() is called inside each function (not at module load time) so
 *    that these functions are only invoked after connectDB() has already
 *    run in server.js.
 *  - The `foods` collection stores the same field shape used by the
 *    frontend mock data (name, description, price, category, image,
 *    isVeg, isPopular, isAvailable) plus MongoDB's auto-generated _id.
 *  - `updatedAt` is managed here on every write so callers never forget it.
 *  - ObjectId construction is wrapped in try-catch as a defensive measure.
 *    The controller validates IDs before calling these functions, but this
 *    ensures the repository never throws an unhandled BSONTypeError.
 */

const { ObjectId } = require('mongodb');
const { getDB } = require('../config/db');

/** @returns {import('mongodb').Collection} */
function foodsCollection() {
  return getDB().collection('foods');
}

/* ─── Read operations ────────────────────────────────────────────────── */

/**
 * findAllFoods — returns all food items, optionally filtered by category.
 * Results are sorted by category then name for a consistent menu ordering.
 *
 * @param {string|null} [category]  Category string to filter by, or null/undefined for all.
 * @returns {Promise<object[]>}
 */
async function findAllFoods(category) {
  const query = category ? { category } : {};
  return foodsCollection()
    .find(query)
    .sort({ category: 1, name: 1 })
    .toArray();
}

/**
 * findFoodById — fetches a single food document by its ObjectId string.
 *
 * Returns null (instead of throwing) when `id` cannot be converted to a
 * valid ObjectId — the controller validates first, but this guard prevents
 * an unhandled BSONTypeError from propagating if called directly.
 *
 * @param {string} id  A 24-character hex ObjectId string.
 * @returns {Promise<object|null>}
 */
async function findFoodById(id) {
  let objectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return null;
  }
  return foodsCollection().findOne({ _id: objectId });
}

/* ─── Write operations ───────────────────────────────────────────────── */

/**
 * insertFood — persists a new food document.
 * Timestamps (createdAt, updatedAt) must be set by the caller before passing
 * the document here so the repository stays data-agnostic.
 *
 * @param {object} foodDoc  Fully-formed food object (no _id — MongoDB generates it).
 * @returns {Promise<import('mongodb').InsertOneResult>}
 */
async function insertFood(foodDoc) {
  return foodsCollection().insertOne(foodDoc);
}

/**
 * updateFoodById — applies a partial update ($set) to a food document and
 * always refreshes `updatedAt`.  Fields not present in `fields` are left
 * untouched (preserves existing data).
 *
 * Returns null (instead of throwing) when `id` cannot be converted to a
 * valid ObjectId — matches the null-on-not-found contract the controller
 * relies on.
 *
 * @param {string} id      24-hex-char ObjectId string.
 * @param {object} fields  Plain object of fields to overwrite.
 * @returns {Promise<object|null>}  The updated document, or null if not found.
 */
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

  // MongoDB driver v5+ returns the document directly (not result.value).
  // Handle both driver shapes gracefully.
  if (result && result._id) {
    return result;         // driver v5+
  }
  return result?.value ?? null;  // driver v4 fallback
}

/**
 * deleteFoodById — permanently removes a single food document.
 *
 * Returns a DeleteResult with deletedCount: 0 (instead of throwing) when
 * `id` cannot be converted to a valid ObjectId — the controller verifies
 * existence before calling this, but this guard prevents BSONTypeError.
 *
 * @param {string} id  24-hex-char ObjectId string.
 * @returns {Promise<import('mongodb').DeleteResult>}
 */
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
