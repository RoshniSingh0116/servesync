/**
 * adminApi.js — ServeSync Admin API Service (Member 3, Commit 5)
 *
 * Dedicated client-side service module connecting Admin UI components
 * to backend Admin, Food, and Order endpoints.
 *
 * Uses the shared Axios instance from ./api.js (configured with base URL
 * and automatic Bearer token injection).
 */

import api from './api';

/* ─── Local Auth Storage Helpers ─────────────────────────────────────────── */

export const ADMIN_TOKEN_KEY = 'adminToken';
export const ADMIN_USER_KEY = 'adminUser';

/**
 * Returns the stored admin session token, or null if none is stored.
 * @returns {string|null}
 */
export function getAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Returns the stored admin user profile object, or null.
 * @returns {object|null}
 */
export function getAdminUser() {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persists the session token and user profile into localStorage.
 * @param {string} token
 * @param {object} [admin]
 */
export function setAdminSession(token, admin) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    if (admin) localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
  } catch (err) {
    console.error('Failed to save admin session:', err);
  }
}

/**
 * Clears the stored admin session.
 */
export function clearAdminSession() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  } catch (err) {
    console.error('Failed to clear admin session:', err);
  }
}

/**
 * Returns true if an admin session token exists.
 * @returns {boolean}
 */
export function isAdminAuthenticated() {
  return Boolean(getAdminToken());
}

/* ─── Admin Endpoints ────────────────────────────────────────────────────── */

/**
 * adminLogin — POST /api/admin/login
 *
 * Authenticates admin credentials.
 * Credentials are sent securely via JSON body; passwords are never logged.
 *
 * @param {string} username - Admin username or email
 * @param {string} password - Admin password
 * @returns {Promise<{ message: string, token: string, admin: object }>}
 */
export async function adminLogin(username, password) {
  const { data } = await api.post('/admin/login', {
    username: String(username).trim(),
    password: String(password),
  });
  return data;
}

/**
 * getAdminDashboard — GET /api/admin/dashboard
 *
 * Returns summary counts for food items and orders across all lifecycle states.
 *
 * @returns {Promise<{
 *   totalFoods: number,
 *   totalFoodItems: number,
 *   availableFoods: number,
 *   unavailableFoods: number,
 *   totalOrders: number,
 *   pendingOrders: number,
 *   preparingOrders: number,
 *   readyOrders: number,
 *   completedOrders: number,
 *   servedOrders: number
 * }>}
 */
export async function getAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data;
}

/**
 * getAdminFoods — GET /api/admin/foods
 *
 * Fetches all food items from the shared foods collection for admin display.
 *
 * @returns {Promise<{ count: number, foods: object[] }>}
 */
export async function getAdminFoods() {
  const { data } = await api.get('/admin/foods');
  return data;
}

/**
 * addFoodItem — POST /api/foods
 *
 * Creates a new food item in the menu.
 *
 * @param {object} foodData
 * @param {string} foodData.name
 * @param {string} foodData.description
 * @param {number} foodData.price
 * @param {string} foodData.category
 * @param {string} [foodData.image]
 * @param {boolean} [foodData.isVeg]
 * @param {boolean} [foodData.isPopular]
 * @param {boolean} [foodData.isAvailable]
 * @returns {Promise<{ message: string, food: object }>}
 */
export async function addFoodItem(foodData) {
  const payload = {
    name: String(foodData.name).trim(),
    description: String(foodData.description).trim(),
    price: Number(foodData.price),
    category: foodData.category,
    image: foodData.image ? String(foodData.image).trim() : '',
    isVeg: Boolean(foodData.isVeg),
    isPopular: Boolean(foodData.isPopular),
    isAvailable: foodData.isAvailable !== false,
  };
  const { data } = await api.post('/foods', payload);
  return data;
}

/**
 * updateFoodItem — PUT /api/foods/:id
 *
 * Updates an existing food item.
 * Strips MongoDB system/protected fields (_id, id, __v, createdAt, updatedAt)
 * to comply with foodController validation.
 *
 * @param {string} id - Food ObjectId string
 * @param {object} foodData - Updated fields
 * @returns {Promise<{ message: string, food: object }>}
 */
export async function updateFoodItem(id, foodData) {
  // Strip internal/protected fields
  // eslint-disable-next-line no-unused-vars
  const { _id, id: _tempId, __v, createdAt, updatedAt, ...cleanData } = foodData;

  const payload = {};
  if (cleanData.name !== undefined) payload.name = String(cleanData.name).trim();
  if (cleanData.description !== undefined) payload.description = String(cleanData.description).trim();
  if (cleanData.price !== undefined) payload.price = Number(cleanData.price);
  if (cleanData.category !== undefined) payload.category = cleanData.category;
  if (cleanData.image !== undefined) payload.image = String(cleanData.image).trim();
  if (cleanData.isVeg !== undefined) payload.isVeg = Boolean(cleanData.isVeg);
  if (cleanData.isPopular !== undefined) payload.isPopular = Boolean(cleanData.isPopular);
  if (cleanData.isAvailable !== undefined) payload.isAvailable = Boolean(cleanData.isAvailable);

  const { data } = await api.put(`/foods/${id}`, payload);
  return data;
}

/**
 * deleteFoodItem — DELETE /api/foods/:id
 *
 * Removes a food item from the menu.
 *
 * @param {string} id - Food ObjectId string
 * @returns {Promise<{ message: string, deletedId: string }>}
 */
export async function deleteFoodItem(id) {
  const { data } = await api.delete(`/foods/${id}`);
  return data;
}

/**
 * getAdminOrders — GET /api/admin/orders
 *
 * Fetches all orders newest-first for the admin orders view.
 *
 * @returns {Promise<{ count: number, orders: object[] }>}
 */
export async function getAdminOrders() {
  const { data } = await api.get('/admin/orders');
  return data;
}
