const express = require('express');
const router = express.Router();
const { createReview, getUserReviews, getMyGivenReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// Both employer and employee can create reviews
router.post('/', protect, createReview);
router.get('/given/me', protect, getMyGivenReviews);
router.get('/:userId', protect, getUserReviews);

module.exports = router;
