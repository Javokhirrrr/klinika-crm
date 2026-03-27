import axios from 'axios';

const RAW_URL = import.meta.env.VITE_API_URL || 'https://klinika-crm-eng-yangi-production.up.railway.app';
const BASE = RAW_URL.trim().replace(/\/+$/, '');

const api = axios.create({
  baseURL: `${BASE}/api/treatment-plans`,
  withCredentials: true,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('accessToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const treatmentPlanApi = {
  // Rejalar
  getPlans: (params)       => api.get('', { params }).then(r => r.data),
  getPlan: (id)            => api.get(`/${id}`).then(r => r.data),
  createPlan: (data)       => api.post('', data).then(r => r.data),
  updatePlan: (id, data)   => api.put(`/${id}`, data).then(r => r.data),
  deletePlan: (id)         => api.delete(`/${id}`).then(r => r.data),

  // Xizmatlar maqomini o'zgartirish
  updateItemStatus: (planId, itemId, status) => 
    api.patch(`/${planId}/items/${itemId}/status`, { status }).then(r => r.data),

  // To'lov qo'shish
  addPayment: (id, data) => 
    api.post(`/${id}/payments`, data).then(r => r.data),
};
