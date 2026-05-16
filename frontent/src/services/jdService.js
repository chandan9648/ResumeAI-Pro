import api from './api';

export const jdService = {
  analyze: (data) => api.post('/jd/analyze', data),
  getAll: () => api.get('/jd'),
  delete: (id) => api.delete(`/jd/${id}`),
};
