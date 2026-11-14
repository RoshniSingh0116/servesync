/**
 * kitchenApi.js — ServeSync (Member 4)
 *
 * Axios-based API client for the Kitchen Dashboard.
 *
 * Uses the Vite proxy-compatible base URL so the same code works in
 * development (Vite dev server proxies /api → http://localhost:5001 per
 * vite.config.js) and in production (VITE_API_BASE_URL env var or same-origin).
 *
 * This is consistent with how orderApi.js and api.js are configured:
 *   - In development: BASE_URL is '' (empty), Vite proxy forwards /api/* to backend
 *   - In production: set VITE_API_BASE_URL to the deployed backend origin
 *
 * All endpoints mirror the backend Kitchen API contract defined in:
 *   server/src/routes/kitchenRoutes.js
 *   server/src/controllers/kitchenController.js
 *
 * Backend status naming:
 *   • Stored in MongoDB as Title-case: Pending | Preparing | Ready | Served
 *   • API accepts lowercase input:    pending | preparing | ready | completed
 *   • "completed" maps to "Served" internally — the PATCH call uses "completed"
 *     for the terminal status to match the backend STATUS_MAP contract.
 *
 * Response normalisation:
 *   normalizeOrder() maps every raw MongoDB document to the shape that
 *   KitchenDashboardPage and OrderCard already expect:
 *     _id  → id      (string)
 *     totalAmount → total  (kept as-is if `total` already exists)
 */

import axios from 'axios';

/* ─── Axios instance ──────────────────────────────────────────────────────── */

// In development, Vite proxies /api → http://localhost:5001 (see vite.config.js).
// In production, set VITE_API_BASE_URL to the deployed backend origin, or leave
// it empty for same-origin serving where /api routes directly to the backend.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const kitchenClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/* ─── Status mapping helpers ──────────────────────────────────────────────── */

/**
 * Maps the Title-case status stored in MongoDB to the lowercase string the
 * backend PATCH endpoint expects in the request body.
 *
 * "Served" (terminal, stored internally) is sent as "completed" because that
 * is the canonical user-facing term defined by the backend STATUS_MAP.
 *
 * @param {string} titleCaseStatus  e.g. 'Pending', 'Served'
 * @returns {string}                e.g. 'pending', 'completed'
 */
export function toApiStatus(titleCaseStatus) {
  if (titleCaseStatus === 'Served') return 'completed';
  return titleCaseStatus.toLowerCase();
}

/* ─── Document normaliser ─────────────────────────────────────────────────── */

/**
 * normalizeOrder — converts a raw MongoDB order document to the shape
 * expected by KitchenDashboardPage and OrderCard.
 *
 * MongoDB documents use `_id` (ObjectId) while the frontend uses `id`.
 * The backend stores the total as `totalAmount`; OrderCard reads `total`.
 * Both aliases are preserved so nothing breaks regardless of which field
 * is present.
 *
 * @param {object} raw  Raw document from the API response.
 * @returns {object}    Normalised order object.
 */
export function normalizeOrder(raw) {
  if (!raw) return raw;
  return {
    ...raw,
    // Map MongoDB _id to the string `id` the frontend uses
    id: raw._id ? String(raw._id) : (raw.id ?? null),
    // Ensure `total` is always present (OrderCard reads it)
    total: raw.total ?? raw.totalAmount ?? null,
  };
}

/* ─── API functions ───────────────────────────────────────────────────────── */

/**
 * fetchAllKitchenOrders — GET /api/kitchen/orders
 *
 * Returns all orders from MongoDB, newest first.
 *
 * @returns {Promise<object[]>}  Array of normalised order objects.
 * @throws  {Error}              With a user-friendly `.message` on failure.
 */
export async function fetchAllKitchenOrders() {
  try {
    const response = await kitchenClient.get('/api/kitchen/orders');
    const { orders = [] } = response.data;
    return orders.map(normalizeOrder);
  } catch (err) {
    throw normaliseError(err);
  }
}

/**
 * fetchKitchenOrdersByStatus — GET /api/kitchen/orders/status/:status
 *
 * Returns orders filtered by the given Title-case status.
 * The status is converted to lowercase before being sent to the API
 * ("Served" → "completed" per the backend contract).
 *
 * @param {string} titleCaseStatus  e.g. 'Pending', 'Preparing', 'Ready', 'Served'
 * @returns {Promise<object[]>}     Array of normalised order objects.
 * @throws  {Error}
 */
export async function fetchKitchenOrdersByStatus(titleCaseStatus) {
  try {
    const apiStatus = toApiStatus(titleCaseStatus);
    const response = await kitchenClient.get(`/api/kitchen/orders/status/${apiStatus}`);
    const { orders = [] } = response.data;
    return orders.map(normalizeOrder);
  } catch (err) {
    throw normaliseError(err);
  }
}

/**
 * patchKitchenOrderStatus — PATCH /api/kitchen/orders/:id/status
 *
 * Sends a status-update request to the backend.
 * The backend enforces the strict one-step-at-a-time forward-only lifecycle.
 *
 * @param {string} orderId          MongoDB ObjectId string of the order.
 * @param {string} nextTitleCase    Title-case next status (e.g. 'Preparing').
 * @returns {Promise<object>}       The updated, normalised order document.
 * @throws  {Error}                 With a user-friendly `.message` on failure.
 *                                  Includes backend validation error messages
 *                                  (invalid transitions, terminal orders, etc.)
 */
export async function patchKitchenOrderStatus(orderId, nextTitleCase) {
  try {
    const apiStatus = toApiStatus(nextTitleCase);
    const response = await kitchenClient.patch(
      `/api/kitchen/orders/${orderId}/status`,
      { status: apiStatus }
    );
    const { order } = response.data;
    return normalizeOrder(order);
  } catch (err) {
    throw normaliseError(err);
  }
}

/* ─── Error normalisation ─────────────────────────────────────────────────── */

/**
 * normaliseError — extracts a human-readable message from an Axios error.
 *
 * Priority:
 *  1. Backend JSON `error` field (kitchen API standard shape)
 *  2. Backend JSON `message` field
 *  3. Network / timeout message
 *
 * @param {import('axios').AxiosError} err
 * @returns {Error}
 */
function normaliseError(err) {
  // If the error already has a clean `.message` and no response (re-thrown),
  // return it as-is to avoid double-wrapping.
  if (err.response?.data) {
    const { error, message } = err.response.data;
    const text = error || message || `Server error (${err.response.status})`;
    const e = new Error(text);
    e.status = err.response.status;
    e.originalError = err;
    return e;
  }

  if (err.code === 'ECONNABORTED') {
    return new Error('Request timed out. Please check your connection and try again.');
  }

  if (!err.response) {
    return new Error(
      'Unable to reach the server. Ensure the backend is running on port 5001.'
    );
  }

  return new Error(err.message || 'An unexpected error occurred.');
}
