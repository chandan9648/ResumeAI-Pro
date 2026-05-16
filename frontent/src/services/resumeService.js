import api from './api';

export const resumeService = {
  upload: (formData) =>
    api.post('/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  optimize: (data) => api.post('/resume/optimize', data),
  getAll: () => api.get('/resume'),
  getById: (id) => api.get(`/resume/${id}`),
  update: (id, data) => api.put(`/resume/${id}`, data),
  duplicate: (id) => api.post(`/resume/${id}/duplicate`),
  delete: (id) => api.delete(`/resume/${id}`),
};
