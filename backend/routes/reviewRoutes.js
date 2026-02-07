const express = require('express');
const router = express.Router();
const { createReview, getUserReviews } = require('../controllers/reviewController');
const { protect, checkRole } = require('../middleware/authMiddleware');

router.post('/', protect, checkRole(['employer']), createReview);
router.get('/:userId', protect, getUserReviews);

module.exports = router;
