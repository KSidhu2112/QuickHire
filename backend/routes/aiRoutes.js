const express = require('express');
const router = express.Router();
const {
    getMatchedWorkers,
    getRecommendedJobs,
    refreshProfileEmbedding
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');

// Route for employers to match top workers for their job post
router.get('/match-workers/:jobId', protect, checkRole(['employer']), getMatchedWorkers);

// Route for workers/jobseekers to get top recommended jobs matching their profile
router.get('/recommend-jobs', protect, checkRole(['jobseeker']), getRecommendedJobs);

// Route for any authenticated user to manually trigger profile embedding regeneration
router.post('/refresh-profile-embedding', protect, refreshProfileEmbedding);

module.exports = router;
