import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('quickhire_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Auth API functions
export const authAPI = {
    // Send OTP for registration
    sendOTP: async (email, name) => {
        const response = await axiosInstance.post('/auth/send-otp', { email, name });
        return response.data;
    },

    // Resend OTP
    resendOTP: async (email) => {
        const response = await axiosInstance.post('/auth/resend-otp', { email });
        return response.data;
    },

    // Register with OTP
    register: async (userData) => {
        console.log('📤 Sending registration request:', userData);
        try {
            const response = await axiosInstance.post('/auth/register', userData);
            console.log('✅ Registration response:', response.data);
            if (response.data.token) {
                localStorage.setItem('quickhire_token', response.data.token);
                localStorage.setItem('quickhire_user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            console.error('❌ Registration API Error:', error);
            console.error('Error response:', error.response?.data);
            throw error;
        }
    },

    // Login
    login: async (email, password) => {
        const response = await axiosInstance.post('/auth/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('quickhire_token', response.data.token);
            localStorage.setItem('quickhire_user', JSON.stringify(response.data.user));
        }
        return response.data;
    },

    // Get current user
    getMe: async () => {
        const response = await axiosInstance.get('/auth/me');
        return response.data;
    },

    // Logout
    logout: () => {
        localStorage.removeItem('quickhire_token');
        localStorage.removeItem('quickhire_user');
    },

    // Check if user is logged in
    isLoggedIn: () => {
        return !!localStorage.getItem('quickhire_token');
    },

    // Get stored user
    getStoredUser: () => {
        const user = localStorage.getItem('quickhire_user');
        return user ? JSON.parse(user) : null;
    },
};

// Job API functions
export const jobAPI = {
    // Get all jobs with filters
    getJobs: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await axiosInstance.get(`/jobs?${params}`);
        return response.data;
    },

    // Get single job
    getJobById: async (id) => {
        const response = await axiosInstance.get(`/jobs/${id}`);
        return response.data;
    },

    // Create job (Employer only)
    createJob: async (jobData) => {
        const response = await axiosInstance.post('/jobs', jobData);
        return response.data;
    },

    // Update job (Employer only)
    updateJob: async (id, jobData) => {
        const response = await axiosInstance.put(`/jobs/${id}`, jobData);
        return response.data;
    },

    // Delete job (Employer only)
    deleteJob: async (id) => {
        const response = await axiosInstance.delete(`/jobs/${id}`);
        return response.data;
    },

    // Get employer's jobs
    getMyJobs: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await axiosInstance.get(`/jobs/employer/my-jobs?${params}`);
        return response.data;
    },

    // Get job statistics
    getJobStats: async (id) => {
        const response = await axiosInstance.get(`/jobs/${id}/stats`);
        return response.data;
    },
};

// Application API functions
export const applicationAPI = {
    // Apply for job (Job Seeker only)
    applyForJob: async (jobId, applicationData) => {
        const response = await axiosInstance.post(`/applications/${jobId}`, applicationData);
        return response.data;
    },

    // Get user's applications (Job Seeker)
    getUserApplications: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await axiosInstance.get(`/applications?${params}`);
        return response.data;
    },

    // Get application statistics
    getUserStats: async () => {
        const response = await axiosInstance.get('/applications/stats');
        return response.data;
    },

    // Get applications for a job (Employer)
    getJobApplications: async (jobId, filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await axiosInstance.get(`/applications/job/${jobId}?${params}`);
        return response.data;
    },

    // Update application status (Employer)
    updateApplicationStatus: async (id, status, notes = '') => {
        const response = await axiosInstance.put(`/applications/${id}/status`, { status, notes });
        return response.data;
    },

    // Withdraw application (Job Seeker)
    withdrawApplication: async (id) => {
        const response = await axiosInstance.delete(`/applications/${id}`);
        return response.data;
    },

    // Get single application
    getApplicationById: async (id) => {
        const response = await axiosInstance.get(`/applications/${id}`);
        return response.data;
    },
};

// Notification API functions
export const notificationAPI = {
    // Get user's notifications
    getNotifications: async (params = {}) => {
        const response = await axiosInstance.get('/notifications', { params });
        return response.data;
    },

    // Get unread count
    getUnreadCount: async () => {
        const response = await axiosInstance.get('/notifications/unread-count');
        return response.data;
    },

    // Mark notification as read
    markAsRead: async (id) => {
        const response = await axiosInstance.put(`/notifications/${id}/read`);
        return response.data;
    },

    // Mark all as read
    markAllAsRead: async () => {
        const response = await axiosInstance.put('/notifications/mark-all-read');
        return response.data;
    },

    // Delete notification
    deleteNotification: async (id) => {
        const response = await axiosInstance.delete(`/notifications/${id}`);
        return response.data;
    },

    // Clear all read notifications
    clearReadNotifications: async () => {
        const response = await axiosInstance.delete('/notifications/clear-read');
        return response.data;
    },
};

// Review API functions
export const reviewAPI = {
    // Create a new review
    createReview: async (reviewData) => {
        const response = await axiosInstance.post('/reviews', reviewData);
        return response.data;
    },

    // Get reviews for a user
    getUserReviews: async (userId) => {
        const response = await axiosInstance.get(`/reviews/${userId}`);
        return response.data;
    },
};

export default axiosInstance;
