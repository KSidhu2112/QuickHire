const Review = require('../models/Review');
const User = require('../models/User');

// @desc    Create a new review
// @route   POST /api/reviews
// @access  Private (Employer only)
exports.createReview = async (req, res) => {
    try {
        const { revieweeId, jobId, rating, comment } = req.body;

        // Check if reviewee exists
        const reviewee = await User.findById(revieweeId);
        if (!reviewee) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            reviewer: req.user._id,
            reviewee: revieweeId,
            job: jobId,
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this employee for this job',
            });
        }

        const review = await Review.create({
            reviewer: req.user._id,
            reviewee: revieweeId,
            job: jobId,
            rating,
            comment,
        });

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            review,
        });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        });
    }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/:userId
// @access  Private
exports.getUserReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.userId })
            .populate('reviewer', 'name profile.avatar')
            .populate('job', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            reviews,
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message,
        });
    }
};
