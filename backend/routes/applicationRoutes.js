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
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Job Seeker routes
router.get('/', protect, checkRole(['jobseeker']), getUserApplications); // Get user's applications
router.get('/stats', protect, checkRole(['jobseeker']), getUserApplicationStats); // Get user's stats
router.post('/:jobId', protect, checkRole(['jobseeker']), applyForJob); // Apply for job
router.delete('/:id', protect, checkRole(['jobseeker']), withdrawApplication); // Withdraw application

// Employer routes
router.get('/job/:jobId', protect, checkRole(['employer']), getJobApplications); // Get job applications
router.get('/employer/hired', protect, checkRole(['employer']), getHiredEmployees); // Get hired employees
router.put('/:id/status', protect, checkRole(['employer']), updateApplicationStatus); // Update status

// Shared routes (Job Seeker or Employer)
router.get('/:id', protect, getApplicationById); // Get single application

module.exports = router;
