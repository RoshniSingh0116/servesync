'use strict';


const { Router } = require('express');
const {
  adminLogin,
  adminGetFoods,
  adminGetOrders,
  adminGetDashboard,
} = require('../controllers/adminController');

const router = Router();

router.post('/login', adminLogin);

router.get('/foods', adminGetFoods);

router.get('/orders', adminGetOrders);

router.get('/dashboard', adminGetDashboard);

module.exports = router;
