const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getAllApplications,
    shortlistApplication,
    getHiredEmployees,
    markAttendance,
    getPaymentSummary,
    updateProfile,
} = require('../controllers/employerController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// All routes are protected and for employers only
router.use(protect);
router.use(checkRole(['employer']));

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// Applications management
router.get('/applications', getAllApplications);
router.put('/applications/:id/shortlist', shortlistApplication);

// Hired employees
router.get('/hired-employees', getHiredEmployees);

// Attendance (for daily jobs)
router.put('/attendance/:applicationId', markAttendance);

// Payments
router.get('/payments', getPaymentSummary);

// Profile
router.put('/profile', updateProfile);

module.exports = router;
