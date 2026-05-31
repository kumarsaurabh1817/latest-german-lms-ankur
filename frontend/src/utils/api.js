// src/utils/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';

    // Only treat as an auth failure when:
    // 1. The server explicitly returned 401 (not 500/503/403)
    // 2. It's NOT the silent /auth/me probe on startup
    // 3. It's NOT a payment endpoint (those can 503 without the user being unauthed)
    const isAuthProbe = url.endsWith('/auth/me');
    const isPaymentRoute = url.includes('/payments/');
    const isDefinitelyUnauthed = status === 401 && !isAuthProbe && !isPaymentRoute;

    if (isDefinitelyUnauthed) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = () => {
  // no-op, handled via HttpOnly cookies
};

export default api;
