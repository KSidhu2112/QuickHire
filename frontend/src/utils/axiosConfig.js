import axios from 'axios';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://quickhire-9ous.onrender.com/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add token to all requests
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle token expiration globally
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token is invalid or expired
            console.error('❌ Session expired. Logging out...');
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Redirect to home page
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
