import axios from 'axios';

const API_URL = "https://web-production-2e51b.up.railway.app";

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Dashboard API
export const dashboardAPI = {
    // Get dashboard metrics
    getMetrics: async (filters = {}) => {
        try {
            const params = new URLSearchParams(filters);
            const response = await api.get(`/api/dashboard/metrics?${params}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching metrics:', error);
            throw error;
        }
    },

    // Get today's appointments
    getTodayAppointments: async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await api.get(`/api/appointments?date=${today}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching appointments:', error);
            throw error;
        }
    },

    // Get today's patients
    getTodayPatients: async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await api.get(`/api/patients?date=${today}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching patients:', error);
            throw error;
        }
    },

    // Get revenue data
    getRevenue: async (period = 'today') => {
        try {
            const response = await api.get(`/api/payments/revenue?period=${period}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching revenue:', error);
            throw error;
        }
    },

    // Get waiting queue
    getWaitingQueue: async () => {
        try {
            const response = await api.get('/api/queue/waiting');
            return response.data;
        } catch (error) {
            console.error('Error fetching queue:', error);
            throw error;
        }
    },

    // Get chart data
    getChartData: async (type = 'revenue', period = 'week') => {
        try {
            const response = await api.get(`/api/analytics/${type}?period=${period}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching chart data:', error);
            throw error;
        }
    },
};

// Patients API
export const patientsAPI = {
    getAll: async (params = {}) => {
        const response = await api.get('/api/patients', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/api/patients/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/api/patients', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/api/patients/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/api/patients/${id}`);
        return response.data;
    },
};

// Appointments API
export const appointmentsAPI = {
    getAll: async (params = {}) => {
        const response = await api.get('/api/appointments', { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/api/appointments/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post('/api/appointments', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/api/appointments/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/api/appointments/${id}`);
        return response.data;
    },
};

// Doctors API
export const doctorsAPI = {
    getAll: async () => {
        const response = await api.get('/api/users?role=doctor');
        return response.data;
    },
};

export default api;
