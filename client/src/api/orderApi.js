/**
 * orderApi.js — ServeSync Member 2
 *
 * Axios-based API client for the Order and Food endpoints.
 *
 * Uses the Vite proxy-compatible base URL so the same code works in
 * development (Vite dev server proxies /api → localhost:5001) and in
 * production (same-origin serving or a configured VITE_API_BASE_URL).
 *
 * All functions return the parsed data payload (not the raw AxiosResponse)
 * so callers don't need to chain .data themselves.
 */

import axios from 'axios';

/* ─── Axios instance ─────────────────────────────────────────────────── */

// In development, Vite proxies /api → http://localhost:5001 (see vite.config.js).
// In production, set VITE_API_BASE_URL to the deployed backend origin, or leave
// it empty for same-origin serving where /api routes directly to the backend.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const apiClient = axios.create({
  baseURL: BASE_URL,          // '' = same origin; Vite proxy handles /api in dev
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,            // 15 s — generous enough for cold DB connections
});

/* ─── Order API ──────────────────────────────────────────────────────── */

/**
 * placeOrder — POST /api/orders
 *
 * Sends the order to the backend.  Prices are intentionally NOT included
 * in the request body — the backend fetches them from MongoDB.
 *
 * @param {{ tableNumber: number, items: { foodId: string, quantity: number }[], specialInstructions?: string }} payload
 * @returns {Promise<{ message: string, order: object }>}
 * @throws {Error} with a human-readable `.message` on 4xx / 5xx
 */
export async function placeOrder(payload) {
  try {
    const { data } = await apiClient.post('/api/orders', payload);
    return data; // { message, order }
  } catch (err) {
    throw normaliseError(err);
  }
}

/**
 * getOrderById — GET /api/orders/:id
 *
 * @param {string} orderId  MongoDB ObjectId string
 * @returns {Promise<{ order: object }>}
 */
export async function getOrderById(orderId) {
  try {
    const { data } = await apiClient.get(`/api/orders/${orderId}`);
    return data; // { order }
  } catch (err) {
    throw normaliseError(err);
  }
}

/* ─── Food API ───────────────────────────────────────────────────────── */

/**
 * getAllFoods — GET /api/foods
 *
 * Fetches the full food catalog from the backend so checkout can map
 * cart item names → MongoDB ObjectIds for the order request body.
 *
 * @returns {Promise<{ count: number, foods: object[] }>}
 */
export async function getAllFoods() {
  try {
    const { data } = await apiClient.get('/api/foods');
    return data; // { count, foods }
  } catch (err) {
    throw normaliseError(err);
  }
}

/* ─── Error normalisation ────────────────────────────────────────────── */

/**
 * normaliseError — extracts a human-readable message from an Axios error.
 *
 * Priority:
 *  1. Backend JSON `error` field (our standard shape)
 *  2. Backend JSON `message` field
 *  3. Network / timeout message
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
    // Network error — no response received
    return new Error(
      'Unable to reach the server. Check your connection or ensure the backend is running.'
    );
  }

  return new Error(err.message || 'An unexpected error occurred.');
}
