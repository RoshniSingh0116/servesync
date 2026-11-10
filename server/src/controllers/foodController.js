'use strict';

/**
 * foodController.js — ServeSync (Member 1)
 *
 * Express controller functions for the Food API.
 *
 * Design decisions:
 *  - ObjectId validation uses the same isValidObjectId() pattern already
 *    established by Member 2 (orderController) and Member 4 (kitchenController).
 *  - Prices are validated as positive numbers (> 0); the frontend FoodForm
 *    enforces the same rule (parseFloat + > 0 check).
 *  - Only explicitly whitelisted fields are accepted on POST and PUT to
 *    prevent mass-assignment.
 *  - On PUT, only the fields that are actually present in req.body are
 *    forwarded to the repository so that absent fields preserve their
 *    stored values (true partial update).
 *  - `isAvailable` defaults to true on creation — this matches what the
 *    admin dashboard seedItems logic does (AdminDashboardPage.jsx).
 *  - `isVeg` and `isPopular` default to false on creation when not provided.
 *  - Category values mirror the CATEGORIES constant in the frontend
 *    mockData.js so the customer menu filter works correctly.
 *  - Boolean fields accept both actual JSON booleans (true/false) and the
 *    string representations "true"/"false" for broader client compatibility.
 *  - Internal MongoDB fields (_id, __v, createdAt) are explicitly blocked
 *    on PUT to prevent accidental or malicious overwrites.
 *  - String fields are validated to be actual strings (not objects/arrays)
 *    to guard against NoSQL operator injection (e.g. {"name": {"$gt": ""}}).
 */

const { ObjectId } = require('mongodb');
const {
  findAllFoods,
  findFoodById,
  insertFood,
  updateFoodById,
  deleteFoodById,
} = require('../repositories/foodRepository');

/* ─── Constants ──────────────────────────────────────────────────────── */

/**
 * Valid category values — mirrors CATEGORIES in client/src/mocks/mockData.js
 * (minus 'All', which is a UI-only filter, not a stored category).
 */
const VALID_CATEGORIES = [
  'Starters',
  'Main Course',
  'Pizza',
  'Burgers',
  'Desserts',
  'Drinks',
];

/**
 * Fields that are managed internally by MongoDB or by the server and must
 * never be accepted from the client on PUT requests.
 */
const PROTECTED_FIELDS = ['_id', '__v', 'createdAt', 'updatedAt'];

/* ─── Helpers ────────────────────────────────────────────────────────── */

/**
 * Returns true if `id` is a valid 24-hex-char MongoDB ObjectId string.
 * Identical to the helper used in orderController and kitchenController.
 *
 * @param {string} id
 */
function isValidObjectId(id) {
  return (
    typeof id === 'string' &&
    ObjectId.isValid(id) &&
    String(new ObjectId(id)) === id
  );
}

/**
 * Coerces a value to a boolean, accepting actual JSON booleans as well as
 * the string literals "true" and "false" (case-insensitive).
 *
 * Returns:
 *   { ok: true,  value: <boolean> }  when the value is acceptable.
 *   { ok: false }                    when the value cannot be coerced.
 *
 * @param {*} val
 * @returns {{ ok: boolean, value?: boolean }}
 */
function parseBoolean(val) {
  if (typeof val === 'boolean') return { ok: true, value: val };
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (lower === 'true')  return { ok: true, value: true };
    if (lower === 'false') return { ok: true, value: false };
  }
  return { ok: false };
}

/**
 * Returns true when `val` is a plain (non-null, non-array) JavaScript object.
 * Used to detect potential NoSQL operator injection in string fields,
 * e.g. { "name": { "$gt": "" } }.
 *
 * @param {*} val
 * @returns {boolean}
 */
function isPlainObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

/* ─── GET /api/foods ──────────────────────────────────────────────────── */

/**
 * getAllFoods — returns all food items from the `foods` collection.
 *
 * Optional query parameter:
 *   ?category=<string>  — filters by that category (exact match, case-sensitive).
 *   Must be one of the valid VALID_CATEGORIES values when provided.
 *
 * Returns an empty array when the collection has no documents.
 */
async function getAllFoods(req, res) {
  try {
    const { category } = req.query;

    /* Validate the category filter if provided */
    if (category !== undefined) {
      if (typeof category !== 'string' || isPlainObject(category)) {
        return res.status(400).json({ error: 'category must be a string.' });
      }
      if (!VALID_CATEGORIES.includes(category)) {
        return res.status(400).json({
          error: `"${category}" is not a valid category.`,
          validCategories: VALID_CATEGORIES,
        });
      }
    }

    const foods = await findAllFoods(category || null);

    return res.status(200).json({
      count: foods.length,
      foods,
    });
  } catch (err) {
    console.error('[getAllFoods] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch food items. Please try again.' });
  }
}

/* ─── GET /api/foods/:id ──────────────────────────────────────────────── */

/**
 * getFoodById — fetches a single food item by its MongoDB ObjectId.
 */
async function getFoodById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid food ID format.' });
    }

    const food = await findFoodById(id);

    if (!food) {
      return res.status(404).json({ error: 'Food item not found.' });
    }

    return res.status(200).json({ food });
  } catch (err) {
    console.error('[getFoodById] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch food item. Please try again.' });
  }
}

/* ─── POST /api/foods ─────────────────────────────────────────────────── */

/**
 * addFood — validates the request body and inserts a new food document.
 *
 * Required fields:  name, description, price, category
 * Optional fields:  image, isVeg, isPopular, isAvailable
 *
 * Validation rules:
 *  - name        : non-empty string
 *  - description : non-empty string
 *  - price       : positive number (> 0)
 *  - category    : one of VALID_CATEGORIES
 *  - image       : string (optional, defaults to '')
 *  - isVeg       : boolean or "true"/"false" string (optional, defaults to false)
 *  - isPopular   : boolean or "true"/"false" string (optional, defaults to false)
 *  - isAvailable : boolean or "true"/"false" string (optional, defaults to true)
 */
async function addFood(req, res) {
  try {
    /* Guard against missing or non-object body */
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    const {
      name,
      description,
      price,
      category,
      image,
      isVeg,
      isPopular,
      isAvailable,
    } = req.body;

    /* ── 1. Validate required string fields ── */
    if (isPlainObject(name) || Array.isArray(name)) {
      return res.status(400).json({ error: 'name must be a string.' });
    }
    if (!name || String(name).trim() === '') {
      return res.status(400).json({ error: 'name is required.' });
    }

    if (isPlainObject(description) || Array.isArray(description)) {
      return res.status(400).json({ error: 'description must be a string.' });
    }
    if (!description || String(description).trim() === '') {
      return res.status(400).json({ error: 'description is required.' });
    }

    /* ── 2. Validate price ── */
    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ error: 'price is required.' });
    }
    if (isPlainObject(price) || Array.isArray(price)) {
      return res.status(400).json({ error: 'price must be a number.' });
    }
    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res
        .status(400)
        .json({ error: 'price must be a positive number.' });
    }

    /* ── 3. Validate category ── */
    if (isPlainObject(category) || Array.isArray(category)) {
      return res.status(400).json({ error: 'category must be a string.' });
    }
    if (!category || String(category).trim() === '') {
      return res.status(400).json({ error: 'category is required.' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        error: `"${category}" is not a valid category.`,
        validCategories: VALID_CATEGORIES,
      });
    }

    /* ── 4. Validate optional boolean fields ── */
    let resolvedIsVeg = false;
    if (isVeg !== undefined) {
      const parsed = parseBoolean(isVeg);
      if (!parsed.ok) {
        return res.status(400).json({ error: 'isVeg must be a boolean (true or false).' });
      }
      resolvedIsVeg = parsed.value;
    }

    let resolvedIsPopular = false;
    if (isPopular !== undefined) {
      const parsed = parseBoolean(isPopular);
      if (!parsed.ok) {
        return res.status(400).json({ error: 'isPopular must be a boolean (true or false).' });
      }
      resolvedIsPopular = parsed.value;
    }

    let resolvedIsAvailable = true;
    if (isAvailable !== undefined) {
      const parsed = parseBoolean(isAvailable);
      if (!parsed.ok) {
        return res.status(400).json({ error: 'isAvailable must be a boolean (true or false).' });
      }
      resolvedIsAvailable = parsed.value;
    }

    /* ── 5. Validate optional image field ── */
    if (image !== undefined && (isPlainObject(image) || Array.isArray(image))) {
      return res.status(400).json({ error: 'image must be a string.' });
    }

    /* ── 6. Build the document ── */
    const now = new Date();
    const foodDoc = {
      name:        String(name).trim(),
      description: String(description).trim(),
      price:       parsedPrice,
      category,
      image:       image ? String(image).trim() : '',
      isVeg:       resolvedIsVeg,
      isPopular:   resolvedIsPopular,
      isAvailable: resolvedIsAvailable,
      createdAt:   now,
      updatedAt:   now,
    };

    /* ── 7. Insert and return ── */
    const result = await insertFood(foodDoc);

    return res.status(201).json({
      message: 'Food item added successfully.',
      food: {
        _id: result.insertedId,
        ...foodDoc,
      },
    });
  } catch (err) {
    console.error('[addFood] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to add food item. Please try again.' });
  }
}

/* ─── PUT /api/foods/:id ──────────────────────────────────────────────── */

/**
 * updateFood — partially updates a food document.
 *
 * Only fields explicitly sent in req.body are updated; all other fields
 * retain their existing stored values.
 *
 * Permitted update fields:
 *   name, description, price, category, image, isVeg, isPopular, isAvailable
 *
 * Blocked fields (rejected with 400):
 *   _id, __v, createdAt, updatedAt — these are managed internally by MongoDB
 *   and the server and must never be overwritten by the client.
 *
 * Validation rules match addFood, but all fields are optional (partial update).
 * At least one valid updatable field must be present.
 */
async function updateFood(req, res) {
  try {
    const { id } = req.params;

    /* ── 1. Validate ID ── */
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid food ID format.' });
    }

    /* ── 2. Guard against missing or non-object body ── */
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    /* ── 3. Block attempts to update internal/protected fields ── */
    const attemptedProtected = PROTECTED_FIELDS.filter(
      (field) => req.body[field] !== undefined
    );
    if (attemptedProtected.length > 0) {
      return res.status(400).json({
        error: `The following fields cannot be updated: ${attemptedProtected.join(', ')}.`,
      });
    }

    /* ── 4. Verify the food exists ── */
    const existing = await findFoodById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Food item not found.' });
    }

    /* ── 5. Build the partial update — only include provided fields ── */
    const updates = {};

    if (req.body.name !== undefined) {
      if (isPlainObject(req.body.name) || Array.isArray(req.body.name)) {
        return res.status(400).json({ error: 'name must be a string.' });
      }
      const trimmed = String(req.body.name).trim();
      if (trimmed === '') {
        return res.status(400).json({ error: 'name cannot be empty.' });
      }
      updates.name = trimmed;
    }

    if (req.body.description !== undefined) {
      if (isPlainObject(req.body.description) || Array.isArray(req.body.description)) {
        return res.status(400).json({ error: 'description must be a string.' });
      }
      const trimmed = String(req.body.description).trim();
      if (trimmed === '') {
        return res.status(400).json({ error: 'description cannot be empty.' });
      }
      updates.description = trimmed;
    }

    if (req.body.price !== undefined) {
      if (isPlainObject(req.body.price) || Array.isArray(req.body.price)) {
        return res.status(400).json({ error: 'price must be a number.' });
      }
      const parsedPrice = Number(req.body.price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return res
          .status(400)
          .json({ error: 'price must be a positive number.' });
      }
      updates.price = parsedPrice;
    }

    if (req.body.category !== undefined) {
      if (isPlainObject(req.body.category) || Array.isArray(req.body.category)) {
        return res.status(400).json({ error: 'category must be a string.' });
      }
      if (!VALID_CATEGORIES.includes(req.body.category)) {
        return res.status(400).json({
          error: `"${req.body.category}" is not a valid category.`,
          validCategories: VALID_CATEGORIES,
        });
      }
      updates.category = req.body.category;
    }

    if (req.body.image !== undefined) {
      if (isPlainObject(req.body.image) || Array.isArray(req.body.image)) {
        return res.status(400).json({ error: 'image must be a string.' });
      }
      updates.image = String(req.body.image).trim();
    }

    if (req.body.isVeg !== undefined) {
      const parsed = parseBoolean(req.body.isVeg);
      if (!parsed.ok) {
        return res.status(400).json({ error: 'isVeg must be a boolean (true or false).' });
      }
      updates.isVeg = parsed.value;
    }

    if (req.body.isPopular !== undefined) {
      const parsed = parseBoolean(req.body.isPopular);
      if (!parsed.ok) {
        return res.status(400).json({ error: 'isPopular must be a boolean (true or false).' });
      }
      updates.isPopular = parsed.value;
    }

    if (req.body.isAvailable !== undefined) {
      const parsed = parseBoolean(req.body.isAvailable);
      if (!parsed.ok) {
        return res.status(400).json({ error: 'isAvailable must be a boolean (true or false).' });
      }
      updates.isAvailable = parsed.value;
    }

    /* ── 6. Reject empty-body requests (no recognisable updatable fields) ── */
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error:
          'No updatable fields were provided. ' +
          'Send at least one of: name, description, price, category, image, isVeg, isPopular, isAvailable.',
      });
    }

    /* ── 7. Persist and return ── */
    const updated = await updateFoodById(id, updates);

    return res.status(200).json({
      message: 'Food item updated successfully.',
      food: updated,
    });
  } catch (err) {
    console.error('[updateFood] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to update food item. Please try again.' });
  }
}

/* ─── DELETE /api/foods/:id ───────────────────────────────────────────── */

/**
 * deleteFood — permanently removes a single food item by ID.
 */
async function deleteFood(req, res) {
  try {
    const { id } = req.params;

    /* ── 1. Validate ID ── */
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid food ID format.' });
    }

    /* ── 2. Verify the food exists ── */
    const existing = await findFoodById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Food item not found.' });
    }

    /* ── 3. Delete ── */
    await deleteFoodById(id);

    return res.status(200).json({
      message: 'Food item deleted successfully.',
      deletedId: id,
    });
  } catch (err) {
    console.error('[deleteFood] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to delete food item. Please try again.' });
  }
}

module.exports = {
  getAllFoods,
  getFoodById,
  addFood,
  updateFood,
  deleteFood,
};
