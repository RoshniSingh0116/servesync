'use strict';


const { ObjectId } = require('mongodb');
const {
  findAllFoods,
  findFoodById,
  insertFood,
  updateFoodById,
  deleteFoodById,
} = require('../repositories/foodRepository');


const VALID_CATEGORIES = [
  'Starters',
  'Main Course',
  'Pizza',
  'Burgers',
  'Desserts',
  'Drinks',
];

const PROTECTED_FIELDS = ['_id', '__v', 'createdAt', 'updatedAt'];


function isValidObjectId(id) {
  return (
    typeof id === 'string' &&
    ObjectId.isValid(id) &&
    String(new ObjectId(id)) === id
  );
}

function parseBoolean(val) {
  if (typeof val === 'boolean') return { ok: true, value: val };
  if (typeof val === 'string') {
    const lower = val.toLowerCase().trim();
    if (lower === 'true')  return { ok: true, value: true };
    if (lower === 'false') return { ok: true, value: false };
  }
  return { ok: false };
}

function isPlainObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}


async function getAllFoods(req, res) {
  try {
    const { category } = req.query;

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


async function addFood(req, res) {
  try {
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

    if (image !== undefined && (isPlainObject(image) || Array.isArray(image))) {
      return res.status(400).json({ error: 'image must be a string.' });
    }

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


async function updateFood(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid food ID format.' });
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object.' });
    }

    const attemptedProtected = PROTECTED_FIELDS.filter(
      (field) => req.body[field] !== undefined
    );
    if (attemptedProtected.length > 0) {
      return res.status(400).json({
        error: `The following fields cannot be updated: ${attemptedProtected.join(', ')}.`,
      });
    }

    const existing = await findFoodById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Food item not found.' });
    }

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

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error:
          'No updatable fields were provided. ' +
          'Send at least one of: name, description, price, category, image, isVeg, isPopular, isAvailable.',
      });
    }

    const updated = await updateFoodById(id, updates);

    if (!updated) {
      return res.status(404).json({ error: 'Food item not found.' });
    }

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


async function deleteFood(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid food ID format.' });
    }

    const existing = await findFoodById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Food item not found.' });
    }

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
