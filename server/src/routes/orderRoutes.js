'use strict';


const { Router } = require('express');
const {
  placeOrder,
  getOrderById,
  getAllOrders,
  getOrdersByTable,
} = require('../controllers/orderController');

const router = Router();

router.post('/', placeOrder);
router.get('/', getAllOrders);
router.get('/table/:tableNumber', getOrdersByTable);
router.get('/:id', getOrderById);

module.exports = router;
