'use strict';


const { Router } = require('express');
const {
  getAllKitchenOrders,
  getKitchenOrdersByStatus,
  getKitchenOrderById,
  updateKitchenOrderStatus,
} = require('../controllers/kitchenController');

const router = Router();

router.get('/orders', getAllKitchenOrders);

router.get('/orders/status/:status', getKitchenOrdersByStatus);

router.get('/orders/:id', getKitchenOrderById);

router.patch('/orders/:id/status', updateKitchenOrderStatus);

module.exports = router;
