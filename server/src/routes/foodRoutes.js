'use strict';


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
