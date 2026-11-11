'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

// Member 1: Food API routes
const foodRoutes = require('./routes/foodRoutes');

// Member 2: Order API routes
const orderRoutes = require('./routes/orderRoutes');

// Member 3: Admin API routes
const adminRoutes = require('./routes/adminRoutes');

// Member 4: Kitchen Dashboard routes
const kitchenRoutes = require('./routes/kitchenRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health-check / root route
app.get('/', (req, res) => {
  res.json({ message: 'ServeSync API is running.' });
});

// Member 1 — Food APIs
app.use('/api/foods', foodRoutes);

// Member 2 — Order APIs
app.use('/api/orders', orderRoutes);

// Member 3 — Admin APIs
app.use('/api/admin', adminRoutes);

// Member 4 — Kitchen Dashboard APIs
app.use('/api/kitchen', kitchenRoutes);

// Connect to MongoDB first, then start accepting HTTP requests.
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
