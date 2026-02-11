const express = require('express');
const router = express.Router();
const { getJobSeekers, getEmployers, getAllUsers, getDashboardStats, getEmployerDetails, getAllJobs, deleteAnyJob } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');

// Get all employees (job seekers) - Protected route (ensure only authenticated users can access, ideally admin)
router.get('/employees', protect, getJobSeekers); // Changed route path to be more RESTful under /api/admin
router.get('/employers', protect, getEmployers);
router.get('/employers/:id', protect, getEmployerDetails);
router.get('/users', protect, getAllUsers);
router.get('/stats', protect, getDashboardStats);

// Admin job management routes
router.get('/jobs', protect, getAllJobs); // Get all jobs (admin view)
router.delete('/jobs/:id', protect, deleteAnyJob); // Delete any job (admin only)
router.delete('/users/:id', protect, require('../controllers/adminController').deleteUser); // Delete user

module.exports = router;
