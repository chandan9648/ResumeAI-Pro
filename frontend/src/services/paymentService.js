import api from './api';

export const paymentService = {
  createOrder: (plan) => api.post('/payment/create-order', { plan }),
  verifyPayment: (data) => api.post('/payment/verify', data),
  getHistory: () => api.get('/payment/history'),
};
