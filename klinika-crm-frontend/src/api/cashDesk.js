import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: `${BASE}/api/cash-desks`,
  withCredentials: true,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const cashDeskApi = {
  // Kassalar
  getDesks: ()             => api.get('/').then(r => r.data),
  createDesk: (data)       => api.post('/', data).then(r => r.data),
  updateDesk: (id, data)   => api.put(`/${id}`, data).then(r => r.data),
  deleteDesk: (id)         => api.delete(`/${id}`).then(r => r.data),

  // Tranzaksiyalar
  getTransactions: (params) => api.get('/transactions', { params }).then(r => r.data),
  createTransaction: (data) => api.post('/transactions', data).then(r => r.data),

  // Statistika
  getStats: (params) => api.get('/stats', { params }).then(r => r.data),
};
