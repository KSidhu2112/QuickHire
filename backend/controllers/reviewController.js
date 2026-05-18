const Review = require('../models/Review');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Create a new review (both employer and employee can review)
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
    try {
        const { revieweeId, jobId, rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating between 1 and 5 is required' });
        }

        // Check if reviewee exists
        const reviewee = await User.findById(revieweeId);
        if (!reviewee) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Can't review yourself
        if (revieweeId === req.user._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'You cannot review yourself',
            });
        }

        // Verify eligibility based on Job/Application status
        // Find application for this job and this pair (one must be employer, one must be employee)
        const application = await Application.findOne({
            job: jobId,
            $or: [
                { jobseeker: req.user._id, employer: revieweeId },
                { jobseeker: revieweeId, employer: req.user._id }
            ]
        });

        if (!application) {
            return res.status(400).json({
                success: false,
                message: 'No valid job application found for this review',
            });
        }

        const isEmployer = req.user.role === 'employer';

        // 1️⃣ Rating Flow rules: Can rate once candidate status is ACCEPTED (Hired)
        if (application.status !== 'ACCEPTED') {
            return res.status(400).json({
                success: false,
                message: 'You can only rate after the employee is hired',
            });
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
            reviewer: req.user._id,
            reviewee: revieweeId,
            job: jobId,
        });

        if (existingReview) {
            // Self-healing: if review exists but flag is not set, update it
            let updated = false;
            if (isEmployer && !application.employerRated) {
                application.employerRated = true;
                updated = true;
            } else if (!isEmployer && !application.employeeRated) {
                application.employeeRated = true;
                updated = true;
            }

            if (updated) {
                await application.save();
            }

            return res.status(200).json({
                success: true,
                message: 'Review already submitted',
                review: existingReview
            });
        }

        // Create the review (hidden by default)
        const review = await Review.create({
            reviewer: req.user._id,
            reviewee: revieweeId,
            job: jobId,
            stars: rating,
            feedback: comment,
            role: req.user.role === 'employer' ? 'Employer' : 'Employee',
            isPublished: false,
        });

        // Update the application flag and real-time status
        if (isEmployer) {
            application.employerRated = true;
            if (!application.employeeRated) {
                application.rating_status = 'Pending Employee Rating';
            }
        } else {
            application.employeeRated = true;
            if (!application.employerRated) {
                application.rating_status = 'Pending Employer Rating';
            }
        }
        await application.save();

        // 3️⃣ Visibility Logic: Check for mutual ratings
        const otherPartyReview = await Review.findOne({
            reviewer: revieweeId,
            reviewee: req.user._id,
            job: jobId
        });

        let publishedNow = false;
        if (otherPartyReview) {
            // Both parties have submitted, publish both
            review.isPublished = true;
            await review.save();

            otherPartyReview.isPublished = true;
            await otherPartyReview.save();

            // Update application flag and final real-time status
            application.ratingPublished = true;
            application.rating_status = 'Verified & Published';
            await application.save();

            // Update stats for both users
            await updateUserRatingStats(req.user._id);
            await updateUserRatingStats(revieweeId);
            publishedNow = true;
        }

        res.status(201).json({
            success: true,
            message: publishedNow
                ? 'Both reviews submitted! Your review is now visible.'
                : 'Review submitted! It will remain hidden until the other party also submits their review or after 48 hours.',
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
        // Only fetch published reviews for public profile
        const reviews = await Review.find({
            reviewee: req.params.userId,
            isPublished: true
        })
            .populate('reviewer', 'name profile.avatar role')
            .populate('job', 'title')
            .sort({ createdAt: -1 });

        // Calculate stats based on published reviews only
        const totalRating = reviews.reduce((sum, r) => sum + r.stars, 0);
        const avgRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews.forEach(r => {
            ratingDistribution[r.stars] = (ratingDistribution[r.stars] || 0) + 1;
        });

        res.status(200).json({
            success: true,
            count: reviews.length,
            avgRating: parseFloat(avgRating),
            ratingDistribution,
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

// @desc    Get reviews I've given
// @route   GET /api/reviews/given/me
// @access  Private
exports.getMyGivenReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ reviewer: req.user._id })
            .populate('reviewee', 'name profile.avatar role')
            .populate('job', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: reviews.length,
            reviews,
        });
    } catch (error) {
        console.error('Error fetching given reviews:', error);
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// Helper function to update user rating stats
async function updateUserRatingStats(userId) {
    // Import from ratingService instead
    // This function can now be removed or simply proxy to the service
    // For minimal changes, let's keep the name but call the service
    return require('../services/ratingService').updateUserRatingStats(userId);
}
