
/**
 * kitchenApi.js — ServeSync (Member 4)
 *
 * Axios-based API client for the Kitchen Dashboard.
 *
 * Development:
 *   Vite proxies /api to http://localhost:5001
 *
 * Production:
 *   VITE_API_BASE_URL=https://servesync-y8zg.onrender.com/api
 *
 * All endpoints mirror the backend Kitchen API contract.
 */

import axios from 'axios';

/* ─── Axios instance ─────────────────────────────────────────────────────── */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const kitchenClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

/* ─── Status mapping helpers ─────────────────────────────────────────────── */

export function toApiStatus(titleCaseStatus) {
  if (titleCaseStatus === 'Served') return 'completed';
  return titleCaseStatus.toLowerCase();
}

/* ─── Document normaliser ───────────────────────────────────────────────── */

export function normalizeOrder(raw) {
  if (!raw) return raw;

  return {
    ...raw,
    id: raw._id ? String(raw._id) : (raw.id ?? null),
    total: raw.total ?? raw.totalAmount ?? null,
  };
}

/* ─── API functions ──────────────────────────────────────────────────────── */

export async function fetchAllKitchenOrders() {
  try {
    const response = await kitchenClient.get('/kitchen/orders');
    const { orders = [] } = response.data;
    return orders.map(normalizeOrder);
  } catch (err) {
    throw normaliseError(err);
  }
}

export async function fetchKitchenOrdersByStatus(titleCaseStatus) {
  try {
    const apiStatus = toApiStatus(titleCaseStatus);

    const response = await kitchenClient.get(
      `/kitchen/orders/status/${apiStatus}`
    );

    const { orders = [] } = response.data;
    return orders.map(normalizeOrder);
  } catch (err) {
    throw normaliseError(err);
  }
}

export async function patchKitchenOrderStatus(orderId, nextTitleCase) {
  try {
    const apiStatus = toApiStatus(nextTitleCase);

    const response = await kitchenClient.patch(
      `/kitchen/orders/${orderId}/status`,
      { status: apiStatus }
    );

    const { order } = response.data;
    return normalizeOrder(order);
  } catch (err) {
    throw normaliseError(err);
  }
}

/* ─── Error normalisation ────────────────────────────────────────────────── */

function normaliseError(err) {
  if (err.response?.data) {
    const { error, message } = err.response.data;
    const text = error || message || `Server error (${err.response.status})`;

    const e = new Error(text);
    e.status = err.response.status;
    e.originalError = err;
    return e;
  }

  if (err.code === 'ECONNABORTED') {
    return new Error(
      'Request timed out. Please check your connection and try again.'
    );
  }

  if (!err.response) {
    return new Error(
      'Unable to reach the server. Ensure the backend is running on port 5001.'
    );
  }

  return new Error(err.message || 'An unexpected error occurred.');
}
