import api from './api';

export const adminService = {
  getUsers: (page = 1) => api.get(`/admin/users?page=${page}`),
  getAnalytics: () => api.get('/admin/analytics'),
  updateUserPlan: (id, plan) => api.patch(`/admin/users/${id}/plan`, { plan }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};
