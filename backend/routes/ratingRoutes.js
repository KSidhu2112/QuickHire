const express = require('express');
const router = express.Router();
const { submitRating, getUserRatings } = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');

router.post('/submit', protect, submitRating);
router.get('/user/:id', getUserRatings);

module.exports = router;
