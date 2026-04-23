import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const register = (data) => apiClient.post('/auth/register', data);
export const login = (data) => apiClient.post('/auth/login', data);
export const getProfile = () => apiClient.get('/auth/me');

// Appointments API
export const createAppointment = (data) => apiClient.post('/appointments', data);
export const getAppointments = () => apiClient.get('/appointments');
export const getAppointment = (id) => apiClient.get(`/appointments/${id}`);
export const updateAppointment = (id, data) => apiClient.put(`/appointments/${id}`, data);
export const cancelAppointment = (id) => apiClient.put(`/appointments/${id}/cancel`);
export const setFieldVisitTime = (id, data) => apiClient.put(`/appointments/${id}/set-visit-time`, data);

// Designs API
export const getDesigns = (params) => apiClient.get('/designs', { params });
export const getDesign = (id) => apiClient.get(`/designs/${id}`);
export const createDesign = (data) => apiClient.post('/designs', data);
export const updateDesign = (id, data) => apiClient.put(`/designs/${id}`, data);
export const deleteDesign = (id) => apiClient.delete(`/designs/${id}`);
export const addReview = (id, data) => apiClient.post(`/designs/${id}/review`, data);

// Users API
export const getProfile_User = () => apiClient.get('/users/profile/me');
export const getUserProfile = (id) => apiClient.get(`/users/${id}`);
export const getAllDesigners = () => apiClient.get('/users/designers');
export const updateUserProfile = (data) => apiClient.put('/users/profile/update', data);
export const searchDesigners = (params) => apiClient.get('/users/search', { params });

export default apiClient;
