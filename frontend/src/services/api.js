import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// AUTH
// ============================================================
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ============================================================
// PROJECTS (App 1)
// ============================================================
export const projectsAPI = {
  getAll: (params) => api.get('/projects', { params }),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  
  // Members
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
  
  // Tasks
  createTask: (id, data) => api.post(`/projects/${id}/tasks`, data),
  updateTask: (id, taskId, data) => api.put(`/projects/${id}/tasks/${taskId}`, data),
  deleteTask: (id, taskId) => api.delete(`/projects/${id}/tasks/${taskId}`),
  
  // Milestones
  createMilestone: (id, data) => api.post(`/projects/${id}/milestones`, data),
  updateMilestone: (id, milestoneId, data) => api.put(`/projects/${id}/milestones/${milestoneId}`, data),
  
  // Documents
  addDocument: (id, data) => api.post(`/projects/${id}/documents`, data),
  
  // Comments
  addComment: (id, data) => api.post(`/projects/${id}/comments`, data),
  
  // Faculty
  addReview: (id, data) => api.post(`/projects/${id}/reviews`, data),
  getFacultyDashboard: () => api.get('/projects/faculty/dashboard'),
};

// ============================================================
// COMPLAINTS (App 2)
// ============================================================
export const complaintsAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  getCategories: () => api.get('/complaints/categories'),
  getStats: () => api.get('/complaints/stats'),
  submit: (data) => api.post('/complaints', data),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  addComment: (id, data) => api.post(`/complaints/${id}/comments`, data),
  submitFeedback: (id, data) => api.post(`/complaints/${id}/feedback`, data),
};

// ============================================================
// USERS
// ============================================================
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getStudents: (params) => api.get('/users/students', { params }),
  getFaculty: () => api.get('/users/faculty'),
  getById: (id) => api.get(`/users/${id}`),
  toggle: (id) => api.patch(`/users/${id}/toggle`),
};

export default api;
