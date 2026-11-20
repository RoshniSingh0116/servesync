'use strict';


const bcrypt          = require('bcryptjs');
const jwt             = require('jsonwebtoken');
const dbConfig        = require('../config/db');
const adminRepository = require('../repositories/adminRepository');
const foodRepository  = require('../repositories/foodRepository');
const orderRepository = require('../repositories/orderRepository');


async function adminLogin(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || String(username).trim() === '') {
      return res.status(400).json({ error: 'username is required.' });
    }
    if (!password || String(password).trim() === '') {
      return res.status(400).json({ error: 'password is required.' });
    }

    const admin = await adminRepository.findAdminByUsername(String(username).trim());

    const credentialsValid =
      admin !== null &&
      Boolean(admin.password) &&
      (await bcrypt.compare(String(password), admin.password));

    if (!credentialsValid) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'servesync_jwt_secret_key_change_in_production';
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: admin.role || 'admin',
      },
      jwtSecret,
      { expiresIn: '24h' }
    );

    const { password: _pw, ...safeAdmin } = admin;

    return res.status(200).json({
      message: 'Login successful.',
      token,
      admin: safeAdmin,
    });
  } catch (err) {
    console.error('[adminLogin] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Login failed. Please try again.' });
  }
}


async function adminGetFoods(req, res) {
  try {
    const foods = await foodRepository.findAllFoods(null);

    return res.status(200).json({
      count: foods.length,
      foods,
    });
  } catch (err) {
    console.error('[adminGetFoods] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch food items. Please try again.' });
  }
}


async function adminGetOrders(req, res) {
  try {
    const rawOrders = await orderRepository.findAllOrders();

    const orders = rawOrders.map((order) => ({
      ...order,
      total: order.total !== undefined ? order.total : order.totalAmount,
      totalAmount: order.totalAmount !== undefined ? order.totalAmount : order.total,
    }));

    return res.status(200).json({
      count: orders.length,
      orders,
    });
  } catch (err) {
    console.error('[adminGetOrders] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch orders. Please try again.' });
  }
}


async function adminGetDashboard(req, res) {
  try {
    const db = dbConfig.getDB();
    const foodsCol  = db.collection('foods');
    const ordersCol = db.collection('orders');

    const [
      totalFoods,
      availableFoods,
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
    ] = await Promise.all([
      foodsCol.countDocuments({}),
      foodsCol.countDocuments({ isAvailable: { $ne: false } }),
      ordersCol.countDocuments({}),
      ordersCol.countDocuments({ status: { $in: ['Pending', 'pending'] } }),
      ordersCol.countDocuments({ status: { $in: ['Preparing', 'preparing'] } }),
      ordersCol.countDocuments({ status: { $in: ['Ready', 'ready'] } }),
      ordersCol.countDocuments({ status: { $in: ['Served', 'served', 'Completed', 'completed'] } }),
    ]);

    return res.status(200).json({
      totalFoods,
      totalFoodItems: totalFoods,
      availableFoods,
      unavailableFoods: totalFoods - availableFoods,
      totalOrders,
      pendingOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      servedOrders: completedOrders,
    });
  } catch (err) {
    console.error('[adminGetDashboard] Error:', err.message);
    return res
      .status(500)
      .json({ error: 'Failed to fetch dashboard data. Please try again.' });
  }
}

module.exports = {
  adminLogin,
  adminGetFoods,
  adminGetOrders,
  adminGetDashboard,
};
