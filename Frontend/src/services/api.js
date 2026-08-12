import axios from 'axios';

// Create a pre-configured Axios instance for future backend connection
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.civicai.local/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Optional: Add interceptors for automatic token inclusion in the future
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('civic_user');
    if (user) {
      const parsed = JSON.parse(user);
      if (parsed.token) {
        config.headers.Authorization = `Bearer ${parsed.token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
