import axios from 'axios';
import { setCredentials, clearCredentials } from '../redux/slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Store reference (will be set in main.jsx)
let store;

export const setStore = (reduxStore) => {
  store = reduxStore;
};

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await axios.post(
          `${API_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { accessToken } = response.data.data;

        // Update token in localStorage
        localStorage.setItem('accessToken', accessToken);

        // Update Redux store if available
        if (store) {
          const user = JSON.parse(localStorage.getItem('user'));
          store.dispatch(setCredentials({ user, accessToken }));
        }

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        if (store) {
          store.dispatch(clearCredentials());
        }

        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');

        // Redirect to login page
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
// export { api };
