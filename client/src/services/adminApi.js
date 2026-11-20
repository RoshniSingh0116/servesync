
import api from './api';


export const ADMIN_TOKEN_KEY = 'adminToken';
export const ADMIN_USER_KEY = 'adminUser';

export function getAdminToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAdminUser() {
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAdminSession(token, admin) {
  try {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    if (admin) localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
  } catch (err) {
    console.error('Failed to save admin session:', err);
  }
}

export function clearAdminSession() {
  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  } catch (err) {
    console.error('Failed to clear admin session:', err);
  }
}

export function isAdminAuthenticated() {
  return Boolean(getAdminToken());
}


export async function adminLogin(username, password) {
  const { data } = await api.post('/admin/login', {
    username: String(username).trim(),
    password: String(password),
  });
  return data;
}

export async function getAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data;
}

export async function getAdminFoods() {
  const { data } = await api.get('/admin/foods');
  return data;
}

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

export async function updateFoodItem(id, foodData) {
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

export async function deleteFoodItem(id) {
  const { data } = await api.delete(`/foods/${id}`);
  return data;
}

export async function getAdminOrders() {
  const { data } = await api.get('/admin/orders');
  return data;
}
