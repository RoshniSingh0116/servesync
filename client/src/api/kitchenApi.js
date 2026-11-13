/**
 * kitchenApi.js — ServeSync (Member 4)
 *
 * Axios-based API client for the Kitchen Dashboard.
 * Connects to the existing backend at http://localhost:5001.
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

const BASE_URL = 'http://localhost:5001';

const kitchenClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
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
    id: raw._id ? String(raw._id) : raw.id,
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
  const response = await kitchenClient.get('/api/kitchen/orders');
  const { orders = [] } = response.data;
  return orders.map(normalizeOrder);
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
  const apiStatus = toApiStatus(titleCaseStatus);
  const response = await kitchenClient.get(`/api/kitchen/orders/status/${apiStatus}`);
  const { orders = [] } = response.data;
  return orders.map(normalizeOrder);
}

/**
 * patchKitchenOrderStatus — PATCH /api/kitchen/orders/:id/status
 *
 * Sends a status-update request to the backend.
 * Validates the transition server-side; the backend enforces the strict
 * one-step-at-a-time forward-only lifecycle.
 *
 * @param {string} orderId          MongoDB ObjectId string of the order.
 * @param {string} nextTitleCase    Title-case next status (e.g. 'Preparing').
 * @returns {Promise<object>}       The updated, normalised order document.
 * @throws  {Error}                 With a user-friendly `.message` on failure.
 *                                  Includes backend validation error messages
 *                                  (invalid transitions, terminal orders, etc.)
 */
export async function patchKitchenOrderStatus(orderId, nextTitleCase) {
  const apiStatus = toApiStatus(nextTitleCase);
  const response = await kitchenClient.patch(
    `/api/kitchen/orders/${orderId}/status`,
    { status: apiStatus }
  );
  const { order } = response.data;
  return normalizeOrder(order);
}

