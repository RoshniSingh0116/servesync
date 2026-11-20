

import axios from 'axios';


const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});


export async function placeOrder(payload) {
  try {
    const { data } = await apiClient.post('/orders', payload);
    return data;
  } catch (err) {
    throw normaliseError(err);
  }
}

export async function getOrderById(orderId) {
  try {
    const { data } = await apiClient.get(`/orders/${orderId}`);
    return data;
  } catch (err) {
    throw normaliseError(err);
  }
}


export async function getAllFoods() {
  try {
    const { data } = await apiClient.get('/foods');
    return data;
  } catch (err) {
    throw normaliseError(err);
  }
}


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
