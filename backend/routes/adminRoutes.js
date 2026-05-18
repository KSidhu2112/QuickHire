const express = require('express');
const router = express.Router();
const {
    getJobSeekers,
    getEmployers,
    getAllUsers,
    getDashboardStats,
    getEmployerDetails,
    getEmployeeDetails,
    getAllJobs,
    deleteAnyJob,
    deleteUser,
    updateUserStatus,
    updateJobStatus,
    getAllApplications,
    getAllPayments,
    getAllReports,
    updateReportStatus,
    getCommunicationLogs
} = require('../controllers/adminController');
const { protect, checkRole } = require('../middleware/authMiddleware');

// Ensure all /api/admin/* routes are admin-only
router.use(protect);
router.use(checkRole(['admin']));

// User Management
router.get('/employees', getJobSeekers);
router.get('/employers', getEmployers);
router.get('/employers/:id', getEmployerDetails);
router.get('/employees/:id', getEmployeeDetails);
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Dashboard & Analytics
router.get('/stats', getDashboardStats);

// Job Management
router.get('/jobs', getAllJobs);
router.patch('/jobs/:id/status', updateJobStatus);
router.delete('/jobs/:id', deleteAnyJob);

// Application Tracking
router.get('/applications', getAllApplications);

// Payment Monitoring
router.get('/payments', getAllPayments);

// Fraud Detection / Reports
router.get('/reports', getAllReports);
router.patch('/reports/:id/status', updateReportStatus);

// Communication Logs
router.get('/messages', getCommunicationLogs);

module.exports = router;
