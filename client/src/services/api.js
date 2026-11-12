/**
 * api.js — ServeSync (Member 1, Commit 5)
 *
 * Shared Axios instance for all HTTP requests to the ServeSync backend.
 *
 * Design decisions:
 *  - Base URL is read from the VITE_API_BASE_URL environment variable so
 *    the same build can point at dev (localhost:5001) or a deployed server
 *    without changing source code.
 *  - Falls back to '/api' (relative) which is handled by the Vite dev-server
 *    proxy defined in vite.config.js, keeping CORS headaches away in
 *    development.
 *  - A 15-second timeout avoids silent hangs on slow connections.
 *  - The response interceptor normalises non-2xx responses into thrown Errors
 *    with a human-readable message extracted from the JSON error field.
 */

import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ─── Response interceptor ───────────────────────────────────────────── */

api.interceptors.response.use(
  // Successful responses pass through unchanged
  (response) => response,

  // Error responses: extract a readable message and rethrow
  (error) => {
    const serverMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';

    const enriched = new Error(serverMessage);
    enriched.status = error.response?.status ?? null;
    enriched.originalError = error;
    return Promise.reject(enriched);
  }
);

export default api;
