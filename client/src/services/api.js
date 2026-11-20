
import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
    }
    return config;
  },
  (error) => Promise.reject(error)
);


api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      } catch {
      }
    }

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
