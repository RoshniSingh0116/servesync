
/**
 * orderApi.js — ServeSync Member 2
 *
 * Axios-based API client for the Order and Food endpoints.
 *
 * Uses a configurable base URL:
 * - Development: Vite proxy handles /api → localhost:5001
 * - Production: VITE_API_BASE_URL points to the deployed backend /api URL.
 *
 * All functions return the parsed data payload.
 */

import axios from 'axios';

/* ─── Axios instance ─────────────────────────────────────────────── */

// Base URL already includes /api, so endpoint paths must NOT include /api.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

/* ─── Order API ──────────────────────────────────────────────────── */

/**
 * placeOrder — POST /api/orders
 *
 * Sends the order to the backend.
 * Prices are fetched by the backend from MongoDB.
 *
 * @param {{ tableNumber: number, items: { foodId: string, quantity: number }[], specialInstructions?: string }} payload
 * @returns {Promise<{ message: string, order: object }>}
 */
export async function placeOrder(payload) {
  try {
    const { data } = await apiClient.post('/orders', payload);
    return data;
  } catch (err) {
    throw normaliseError(err);
  }
}

/**
 * getOrderById — GET /api/orders/:id
 *
 * @param {string} orderId MongoDB ObjectId string
 * @returns {Promise<{ order: object }>}
 */
export async function getOrderById(orderId) {
  try {
    const { data } = await apiClient.get(`/orders/${orderId}`);
    return data;
  } catch (err) {
    throw normaliseError(err);
  }
}

/* ─── Food API ───────────────────────────────────────────────────── */

/**
 * getAllFoods — GET /api/foods
 *
 * Fetches the food catalog from the backend.
 *
 * @returns {Promise<{ count: number, foods: object[] }>}
 */
export async function getAllFoods() {
  try {
    const { data } = await apiClient.get('/foods');
    return data;
  } catch (err) {
    throw normaliseError(err);
  }
}

/* ─── Error normalisation ─────────────────────────────────────────── */

/**
 * Extracts a human-readable message from an Axios error.
 *
 * Priority:
 * 1. Backend JSON error field
 * 2. Backend JSON message field
 * 3. Network / timeout message
 *
 * @param {import('axios').AxiosError} err
 * @returns {Error}
 */
function normaliseError(err) {
  if (err.response?.data) {
    const { error, message } = err.response.data;
    const text = error || message || `Server error (${err.response.status})`;

    const e = new Error(text);
    e.status = err.response.status;

    return e;
  }

  if (err.code === 'ECONNABORTED') {
    return new Error('Request timed out. Please try again.');
  }

  if (!err.response) {
    return new Error(
      'Unable to reach the server. Check your connection or ensure the backend is running.'
    );
  }

  return new Error(err.message || 'An unexpected error occurred.');
}
