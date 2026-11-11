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

/* ─── 404 handler — catch all unmatched routes ───────────────────────── */
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

/* ─── Global error handler ───────────────────────────────────────────── */
// Catches synchronous errors thrown by route handlers and middleware,
// including JSON parse errors (Express throws a SyntaxError with
// status 400 when the request body is malformed JSON).
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  // Unexpected errors — log the full error internally but return a safe
  // generic message to the client so internal details are not leaked.
  console.error('[GlobalErrorHandler]', err.message);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

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
