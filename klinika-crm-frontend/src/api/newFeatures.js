import axios from 'axios';

const RAW_API_URL = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const API_URL = RAW_API_URL || "/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Switch for avoiding infinite loops and handling concurrent 401s
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Handle 401 errors and refresh token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        originalRequest.headers['Authorization'] = 'Bearer ' + token;
                        return api(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');

            if (refreshToken) {
                try {
                    const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

                    const newAccessToken = res.data?.accessToken;
                    if (newAccessToken) {
                        localStorage.setItem('accessToken', newAccessToken);

                        // Update current and future requests
                        api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
                        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                        processQueue(null, newAccessToken);
                        return api(originalRequest);
                    }
                } catch (refreshError) {
                    processQueue(refreshError, null);
                    console.error('❌ Token refresh failed via Axios:', refreshError);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                } finally {
                    isRefreshing = false;
                }
            } else {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

// Attendance API
export const attendanceAPI = {
    // Employee endpoints
    clockIn: (location) => api.post('/attendance/clock-in', { location }),
    clockOut: (location) => api.post('/attendance/clock-out', { location }),
    getMyToday: () => api.get('/attendance/my-today'),
    getMyHistory: (params) => api.get('/attendance/my-history', { params }),

    // Admin endpoints
    getAll: (params) => api.get('/attendance', { params }),
    getReport: (params) => api.get('/attendance/report', { params }),
    update: (id, data) => api.put(`/attendance/${id}`, data),
    delete: (id) => api.delete(`/attendance/${id}`),
};

// Commission API
export const commissionAPI = {
    // Employee endpoints
    getMyEarnings: () => api.get('/commissions/my-earnings'),
    getMyHistory: (params) => api.get('/commissions/my-history', { params }),

    // Admin endpoints
    getAll: (params) => api.get('/commissions', { params }),
    getReport: (params) => api.get('/commissions/report', { params }),
    approve: (id) => api.put(`/commissions/${id}/approve`),
    pay: (id, data) => api.put(`/commissions/${id}/pay`, data),
    cancel: (id, data) => api.put(`/commissions/${id}/cancel`, data),
    updateUserSettings: (userId, data) => api.put(`/commissions/users/${userId}/settings`, data),
};

// Queue API
export const queueAPI = {
    // Staff endpoints
    join: (data) => api.post('/queue/join', data),
    getCurrent: (params) => api.get('/queue/current', { params }),
    getStats: () => api.get('/queue/stats'),
    call: (id) => api.put(`/queue/${id}/call`),
    startService: (id) => api.put(`/queue/${id}/start`),
    complete: (id) => api.put(`/queue/${id}/complete`),
    cancel: (id, data) => api.put(`/queue/${id}/cancel`, data),
    changePriority: (id, priority) => api.put(`/queue/${id}/priority`, { priority }),

    // Public endpoint
    getMyPosition: (patientId) => api.get('/queue/my-position', { params: { patientId } }),

    // Admin endpoints
    clearOld: (days) => api.delete('/queue/clear-old', { params: { days } }),
};

export default api;
