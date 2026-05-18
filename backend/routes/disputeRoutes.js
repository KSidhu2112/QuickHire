const express = require('express');
const router = express.Router();
const {
    getDisputes,
    getDisputeDetails,
    resolveDispute,
    raiseDispute,
    reportPaymentIssue,
    updateDisputeStatus,
    getMonitoringStats
} = require('../controllers/disputeController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.get('/', protect, getDisputes);
router.get('/monitoring', protect, checkRole(['admin']), getMonitoringStats);
router.get('/:id', protect, getDisputeDetails);
router.post('/', protect, raiseDispute);
router.post('/report-payment', protect, checkRole(['jobseeker']), reportPaymentIssue);

// Admin routes
router.put('/:id/resolve', protect, checkRole(['admin']), resolveDispute);
router.put('/:id/status', protect, checkRole(['admin']), updateDisputeStatus);

module.exports = router;
