const express = require('express');
const router = express.Router();
const { getDisputes, getDisputeDetails, resolveDispute } = require('../controllers/disputeController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getDisputes);
router.get('/:id', protect, getDisputeDetails);
router.put('/:id/resolve', protect, authorize('admin'), resolveDispute);

module.exports = router;
