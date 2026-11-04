'use strict';

/**
 * foodRoutes.js — ServeSync (Member 1)
 *
 * Registers the Food API routes on an Express Router.
 * Mounted at /api/foods in server.js.
 *
 * Routes:
 *   GET    /api/foods          → getAllFoods   (customer menu + admin list)
 *   GET    /api/foods/:id      → getFoodById   (single food detail)
 *   POST   /api/foods          → addFood       (admin: add new item)
 *   PUT    /api/foods/:id      → updateFood    (admin: edit item)
 *   DELETE /api/foods/:id      → deleteFood    (admin: remove item)
 */

const { Router } = require('express');
const {
  getAllFoods,
  getFoodById,
  addFood,
  updateFood,
  deleteFood,
} = require('../controllers/foodController');

const router = Router();

router.get('/',     getAllFoods);
router.get('/:id',  getFoodById);
router.post('/',    addFood);
router.put('/:id',  updateFood);
router.delete('/:id', deleteFood);

module.exports = router;
