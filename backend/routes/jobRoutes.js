const express = require('express');
const router = express.Router();
const {
    getJobs,
    getJobById,
    createJob,
    updateJob,
    deleteJob,
    getMyJobs,
    getJobStats,
    getNearbyJobs,
} = require('../controllers/jobController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Public routes
router.get('/', optionalProtect, getJobs); // Get all jobs with filters
router.get('/nearby', optionalProtect, getNearbyJobs); // Get nearby jobs by lat/lng/distance


// Employer routes (protected) - MUST come before /:id route
router.post('/', protect, checkRole(['employer']), createJob); // Create job
router.get('/employer/my-jobs', protect, checkRole(['employer']), getMyJobs); // Get employer's jobs
router.put('/:id', protect, checkRole(['employer']), updateJob); // Update job
router.delete('/:id', protect, checkRole(['employer']), deleteJob); // Delete job
router.get('/:id/stats', protect, checkRole(['employer']), getJobStats); // Get job stats

// Public route with dynamic ID - MUST come after specific routes
router.get('/:id', getJobById); // Get single job

module.exports = router;

