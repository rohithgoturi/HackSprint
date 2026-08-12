import axios from 'axios';

// Centralized Axios API client instance connected to backend API base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Automatic JWT Authorization header injection
api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem('civic_token');
    if (!token) {
      try {
        const userStr = localStorage.getItem('civic_user');
        if (userStr) {
          const parsed = JSON.parse(userStr);
          if (parsed && parsed.token) {
            token = parsed.token;
          }
        }
      } catch (e) {}
    }
    if (!token) {
      try {
        const authStr = localStorage.getItem('civicai_auth');
        if (authStr) {
          const parsed = JSON.parse(authStr);
          if (parsed && parsed.token) {
            token = parsed.token;
          } else if (parsed && parsed.user && parsed.user.token) {
            token = parsed.user.token;
          }
        }
      } catch (e) {}
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Health check helper to verify backend connectivity
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health API check failed:', error);
    throw error;
  }
};

/**
 * Authentication Endpoints API
 */
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me')
};

/**
 * Complaint Endpoints API
 */
export const complaintAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (complaintData) => api.post('/complaints', complaintData),
  enhanceDescription: (description) => api.post('/complaints/enhance-description', { description }),
  analyze: (id) => api.post(`/complaints/${id}/analyze`),
  getTimeline: (id) => api.get(`/complaints/${id}/timeline`),
  getSla: (id) => api.get(`/complaints/${id}/sla`),
  getSimilar: (id) => api.get(`/complaints/${id}/similar`),
  updateStatus: (id, payload) => api.patch(`/complaints/${id}/status`, payload),
  assignWorker: (id, payload) => api.patch(`/complaints/${id}/assign`, payload),
  overridePriority: (id, payload) => api.patch(`/complaints/${id}/priority`, payload),
  overrideDepartment: (id, payload) => api.patch(`/complaints/${id}/department`, payload),
  submitResolution: (id, payload) => api.post(`/complaints/${id}/resolution`, payload),
  getResolution: (id) => api.get(`/complaints/${id}/resolution`),
  verifyResolution: (id, payload) => api.patch(`/complaints/${id}/verify`, payload),
  close: (id) => api.patch(`/complaints/${id}/close`)
};

/**
 * Dashboard Endpoints API
 */
export const dashboardAPI = {
  getCitizenDashboard: () => api.get('/dashboard/citizen'),
  getAdminDashboard: () => api.get('/dashboard/admin')
};

/**
 * Worker Endpoints API
 */
export const workerAPI = {
  getMyTasks: () => api.get('/worker/complaints'),
  getSummary: () => api.get('/worker/summary'),
  getDashboard: () => api.get('/worker/summary')
};

/**
 * Admin Management Endpoints API
 */
export const adminAPI = {
  getWorkers: () => api.get('/admin/workers'),
  getDepartments: () => api.get('/admin/departments'),
  getAnalytics: () => api.get('/admin/analytics')
};

/**
 * Notification Endpoints API
 */
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all')
};

export default api;
