'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');

const foodRoutes = require('./routes/foodRoutes');

const orderRoutes = require('./routes/orderRoutes');

const adminRoutes = require('./routes/adminRoutes');

const kitchenRoutes = require('./routes/kitchenRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'ServeSync API is running.' });
});

app.use('/api/foods', foodRoutes);

app.use('/api/orders', orderRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/kitchen', kitchenRoutes);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  console.error('[GlobalErrorHandler]', err.message);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

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
