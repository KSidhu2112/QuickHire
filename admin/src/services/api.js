import axios from 'axios';

export const API_BASE = (import.meta.env.VITE_API_URL || 'https://quickhire-1-k5vh.onrender.com/api').replace(/\/+$/, '');
const API_ORIGIN = new URL(API_BASE, window.location.origin).origin;

const getRequestUrl = (config) => {
    try {
        return new URL(config.url, config.baseURL || API_BASE);
    } catch {
        return null;
    }
};

const isBackendRequest = (url) => url?.origin === API_ORIGIN;
const isPublicAuthRequest = (url) => url?.pathname.startsWith('/api/auth/') && /\/(login|register|send-otp|resend-otp|forgot-password|reset-password)$/.test(url.pathname);

const clearAdminSession = () => {
    localStorage.removeItem('adminToken');
    if (window.location.pathname !== '/login') {
        window.location.assign('/login');
    }
};

const adminApi = axios.create();

adminApi.interceptors.request.use((config) => {
    const url = getRequestUrl(config);
    if (!isBackendRequest(url)) return config;

    if (isPublicAuthRequest(url)) {
        delete config.headers.Authorization;
        delete config.headers.authorization;
        return config;
    }

    const token = localStorage.getItem('adminToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    } else {
        delete config.headers.Authorization;
        delete config.headers.authorization;
    }
    return config;
});

adminApi.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = getRequestUrl(error.config || {});
        if (error.response?.status === 401 && isBackendRequest(url) && !isPublicAuthRequest(url)) {
            clearAdminSession();
        }
        return Promise.reject(error);
    },
);

export const adminFetch = async (input, options = {}) => {
    const requestUrl = new URL(typeof input === 'string' ? input : input.url, API_BASE);
    const headers = new Headers(options.headers || {});

    if (requestUrl.origin === API_ORIGIN) {
        const token = localStorage.getItem('adminToken');
        if (token) headers.set('Authorization', `Bearer ${token}`);
        else headers.delete('Authorization');
    }

    const response = await fetch(input, { ...options, headers });
    if (response.status === 401 && requestUrl.origin === API_ORIGIN) {
        clearAdminSession();
    }
    return response;
};

export default adminApi;
