const express = require('express');
const router = express.Router();
const {
    sendOTP,
    register,
    login,
    getMe,
    resendOTP,
    updateProfile,
    forgotPassword,
    resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/send-otp', sendOTP);
router.post('/resend-otp', resendOTP);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

module.exports = router;
