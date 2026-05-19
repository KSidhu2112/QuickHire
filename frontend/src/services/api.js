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

// Add response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('⚠️ Session expired or unauthorized. Clearing storage.');
            localStorage.removeItem('quickhire_token');
            localStorage.removeItem('quickhire_user');
            
            // Optional: Redirect to login if not already there
            if (!window.location.pathname.includes('/login') && 
                !window.location.pathname.includes('/signup') &&
                window.location.pathname !== '/') {
                window.location.href = '/login?expired=true';
            }
        }
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
    resendOTP: async (email, purpose = 'registration') => {
        const response = await axiosInstance.post('/auth/resend-otp', { email, purpose });
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

    // Get public statistics (jobs, employees, employers count)
    getPublicStats: async () => {
        const response = await axiosInstance.get('/jobs/public/stats');
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

    // Get all applications for current employer
    getEmployerApplications: async (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const response = await axiosInstance.get(`/employer/applications?${params}`);
        return response.data;
    },

    // Update application status (Employer)
    updateStatus: async (id, status, notes = '') => {
        const response = await axiosInstance.put(`/applications/${id}/status`, { status, notes });
        return response.data;
    },

    // Legacy method name (for compatibility if used elsewhere)
    updateApplicationStatus: async (id, status, notes = '') => {
        return applicationAPI.updateStatus(id, status, notes);
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

    // Get hired employees (Employer)
    getHiredEmployees: async () => {
        const response = await axiosInstance.get('/applications/employer/hired');
        return response.data;
    },

    // Mark work as completed (Employer)
    markWorkCompleted: async (id) => {
        const response = await axiosInstance.post(`/applications/${id}/work-completed`);
        return response.data;
    },

    // Mark work as completed (Employee)
    markWorkCompletedEmployee: async (id) => {
        const response = await axiosInstance.post(`/applications/${id}/work-completed-employee`);
        return response.data;
    },

    // Mark as paid (Employer)
    markAsPaid: async (id) => {
        const response = await axiosInstance.post(`/applications/${id}/mark-paid`);
        return response.data;
    },

    // Confirm payment received (Employee)
    confirmPaymentReceived: async (id) => {
        const response = await axiosInstance.post(`/applications/${id}/confirm-payment`);
        return response.data;
    },
    // Direct hire matched worker (Employer only)
    directHireWorker: async (jobId, workerId) => {
        const response = await axiosInstance.post('/applications/direct-hire', { jobId, workerId });
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

// Payment API functions
export const paymentAPI = {
    // Create Razorpay Order
    createOrder: async (paymentData) => {
        const response = await axiosInstance.post('/payments/create-order', paymentData);
        return response.data;
    },

    // Verify Payment
    verifyPayment: async (paymentData) => {
        const response = await axiosInstance.post('/payments/verify-payment', paymentData);
        return response.data;
    },

    // Create Verification Order (for profile verification)
    createVerificationOrder: async () => {
        const response = await axiosInstance.post('/payments/create-verification-order');
        return response.data;
    },

    // Verify Verification Payment
    verifyVerificationPayment: async (paymentData) => {
        const response = await axiosInstance.post('/payments/verify-verification-payment', paymentData);
        return response.data;
    },

    // Get user's transaction history
    getHistory: async () => {
        const response = await axiosInstance.get('/payments/history');
        return response.data;
    },
};

// Verification API functions
export const verificationAPI = {
    getEmployeeVerifications: async (params = {}) => {
        const response = await axiosInstance.get('/verification/employee/all', { params });
        return response.data;
    },
    getEmployerVerifications: async (params = {}) => {
        const response = await axiosInstance.get('/verification/employer/all', { params });
        return response.data;
    },
    startWork: async (id) => {
        const response = await axiosInstance.post(`/verification/${id}/start-work`);
        return response.data;
    },
    submitWork: async (id, data) => {
        const response = await axiosInstance.post(`/verification/${id}/submit-work`, data);
        return response.data;
    },
    employeeConfirm: async (id, data) => {
        const response = await axiosInstance.post(`/verification/${id}/employee-confirm`, data);
        return response.data;
    },
    employerConfirm: async (id, data) => {
        const response = await axiosInstance.post(`/verification/${id}/employer-confirm`, data);
        return response.data;
    },
    lockEscrow: async (id, amount) => {
        const response = await axiosInstance.post(`/verification/${id}/lock-escrow`, { amount });
        return response.data;
    },
    getTimeline: async (id) => {
        const response = await axiosInstance.get(`/verification/${id}/timeline`);
        return response.data;
    },
    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

// Dispute API functions
export const disputeAPI = {
    raiseDispute: async (data) => {
        const response = await axiosInstance.post('/disputes', data);
        return response.data;
    },
    getDisputes: async (params = {}) => {
        const response = await axiosInstance.get('/disputes', { params });
        return response.data;
    },
    getDisputeDetails: async (id) => {
        const response = await axiosInstance.get(`/disputes/${id}`);
        return response.data;
    },
    // Report payment issue
    reportPaymentIssue: async (data) => {
        const response = await axiosInstance.post('/disputes/report-payment', data);
        return response.data;
    }
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

// Rating API functions (Alias for reviewAPI to support RatingModal)
export const ratingAPI = {
    submitRating: async ({ jobId, toUserId, stars, feedback }) => {
        return reviewAPI.createReview({
            jobId,
            revieweeId: toUserId,
            rating: stars,
            comment: feedback
        });
    }
};

// AI API functions
export const aiAPI = {
    // Get AI matched workers for a job
    getMatchedWorkers: async (jobId, limit = 5) => {
        const response = await axiosInstance.get(`/ai/match-workers/${jobId}?limit=${limit}`);
        return response.data;
    },

    // Get recommended jobs for logged-in worker
    getRecommendedJobs: async (limit = 5) => {
        const response = await axiosInstance.get(`/ai/recommend-jobs?limit=${limit}`);
        return response.data;
    },

    // Refresh profile embedding
    refreshProfileEmbedding: async () => {
        const response = await axiosInstance.post('/ai/refresh-profile-embedding');
        return response.data;
    }
};

export default axiosInstance;
