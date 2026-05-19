const express = require('express');
const router = express.Router();
const {
    applyForJob,
    getUserApplications,
    getJobApplications,
    updateApplicationStatus,
    withdrawApplication,
    getApplicationById,
    getUserApplicationStats,
    getHiredEmployees,
    confirmWork,
    markAsPaid,
    confirmPaymentReceived,
    directHireWorker,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Employer routes
router.post('/direct-hire', protect, checkRole(['employer']), directHireWorker); // Direct hire a matched worker

// Job Seeker routes
router.get('/', protect, checkRole(['jobseeker']), getUserApplications); // Get user's applications
router.get('/stats', protect, checkRole(['jobseeker']), getUserApplicationStats); // Get user's stats
router.post('/:jobId', protect, checkRole(['jobseeker']), applyForJob); // Apply for job
router.delete('/:id', protect, checkRole(['jobseeker']), withdrawApplication); // Withdraw application
router.post('/:id/confirm-payment', protect, checkRole(['jobseeker']), confirmPaymentReceived); // Confirm payment received

// Employer routes (remaining)
router.get('/job/:jobId', protect, checkRole(['employer']), getJobApplications); // Get job applications
router.get('/employer/hired', protect, checkRole(['employer']), getHiredEmployees); // Get hired employees
router.put('/:id/status', protect, checkRole(['employer']), updateApplicationStatus); // Update status
router.post('/:id/mark-paid', protect, checkRole(['employer']), markAsPaid); // Mark as paid

// Shared routes (Job Seeker or Employer)
router.post('/:id/confirm', protect, confirmWork); // Dual Confirmation
router.get('/:id', protect, getApplicationById); // Get single application

module.exports = router;
