const express = require('express');
const router = express.Router();
const {
    startWork,
    submitWork,
    employerConfirm,
    employeeConfirm,
    lockEscrow,
    checkAndApplyPenalties,
    getVerificationStatus,
    getEmployerVerifications,
    getEmployeeVerifications,
    uploadProof,
    getTimeline,
} = require('../controllers/verificationController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// ===== Static/List routes MUST come BEFORE parameterized routes =====

// List routes
router.get('/employer/all', protect, checkRole(['employer']), getEmployerVerifications);
router.get('/employee/all', protect, checkRole(['jobseeker']), getEmployeeVerifications);

// Admin routes
router.post('/check-penalties', protect, checkRole(['admin']), checkAndApplyPenalties);

// ===== Parameterized routes (/:applicationId) =====

// Employee actions
router.post('/:applicationId/start-work', protect, checkRole(['jobseeker']), startWork);
router.post('/:applicationId/submit-work', protect, checkRole(['jobseeker']), submitWork);
router.post('/:applicationId/employee-confirm', protect, checkRole(['jobseeker']), employeeConfirm);

// Employer actions
router.post('/:applicationId/employer-confirm', protect, checkRole(['employer']), employerConfirm);
router.post('/:applicationId/lock-escrow', protect, checkRole(['employer']), lockEscrow);

// Shared routes
router.get('/:applicationId', protect, getVerificationStatus);
router.get('/:applicationId/timeline', protect, getTimeline);
router.post('/:applicationId/upload-proof', protect, uploadProof);

module.exports = router;
