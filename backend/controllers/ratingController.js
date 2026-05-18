const Review = require('../models/Review');
const Application = require('../models/Application');
const User = require('../models/User');
const ratingService = require('../services/ratingService');
const mongoose = require('mongoose');

/**
 * @desc    Submit a rating for a completed job
 * @route   POST /api/rating/submit
 * @access  Private
 */
exports.submitRating = async (req, res) => {
    try {
        const { jobId, toUserId, stars, feedback } = req.body;
        console.log(`📩 Rating Submission Body:`, JSON.stringify(req.body));

        // Ensure user is authenticated
        if (!req.user || !req.user._id) {
            console.error('❌ Rating Error: User not found on request');
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        console.log(`📩 Rating Submission UserID:`, req.user._id);

        if (!stars || stars < 1 || stars > 5) {
            return res.status(400).json({ success: false, message: 'ERR_INVALID_STARS', detail: 'Rating between 1 and 5 is required' });
        }

        // 1. Validate Eligibility
        if (!mongoose.Types.ObjectId.isValid(jobId) || !mongoose.Types.ObjectId.isValid(toUserId)) {
            console.error(`❌ Rating Error: Invalid ID format. jobId: ${jobId}, toUserId: ${toUserId}`);
            return res.status(400).json({ success: false, message: 'ERR_INVALID_ID_FORMAT' });
        }

        console.log('✅ IDs are valid format');

        const jobObjectId = new mongoose.Types.ObjectId(jobId.toString());
        const toUserObjectId = new mongoose.Types.ObjectId(toUserId.toString());
        const currentUserObjectId = new mongoose.Types.ObjectId(req.user._id.toString());

        if (currentUserObjectId.equals(toUserObjectId)) {
            console.error(`❌ Rating Error: User ${req.user._id} attempted to rate themselves`);
            return res.status(400).json({ success: false, message: 'ERR_SELF_RATING' });
        }

        // 1. Handle Idempotency EARLY: If review already exists, sync flags and return success
        const existingReview = await Review.findOne({
            reviewer: currentUserObjectId,
            reviewee: toUserObjectId,
            job: jobObjectId
        });
        console.log('🔍 Existing review checked:', !!existingReview);

        // 2. Find the engagement
        const application = await Application.findOne({
            job: jobObjectId,
            $or: [
                { jobseeker: currentUserObjectId, employer: toUserObjectId },
                { jobseeker: toUserObjectId, employer: currentUserObjectId }
            ]
        });

        if (!application) {
            console.error(`❌ Rating Error: Engagement not found. User ${currentUserObjectId} is trying to rate ${toUserObjectId} for job ${jobObjectId}.`);
            return res.status(400).json({
                success: false,
                message: `Engagement not found. No application connects these parties for this job.`,
                code: 'ERR_ENGAGEMENT_NOT_FOUND'
            });
        }
        console.log('✅ Application found:', application._id);

        // Determine role
        const employerId = application.employer._id || application.employer;

        if (!employerId) {
            console.error('❌ Rating Error: Employer ID missing on application', application._id);
            return res.status(500).json({ success: false, message: 'Application data corrupted: employer missing' });
        }

        console.log(`🔍 Debug Role Check: UserID=${currentUserObjectId}, AppEmployer=${employerId}`);

        const isEmployer = currentUserObjectId.toString() === employerId.toString();
        const role = isEmployer ? 'Employer' : 'Employee';
        console.log(`ℹ️ Rating Trace: identified as ${role}`);

        if (existingReview) {
            console.log(`ℹ️ Rating Trace: Review already exists. Ensuring flags are synced.`);
            if (isEmployer) application.employerRated = true;
            else application.employeeRated = true;

            // Check if published
            const otherPartyReview = await Review.findOne({
                reviewer: toUserObjectId,
                reviewee: currentUserObjectId,
                job: jobObjectId
            });

            if (otherPartyReview) {
                application.ratingPublished = true;
                existingReview.isPublished = true;
                await existingReview.save();
                otherPartyReview.isPublished = true;
                await otherPartyReview.save();
            }
            await application.save();
            return res.status(200).json({ success: true, message: 'Rating already submitted!', bothRated: !!application.ratingPublished });
        }

        // 3. New Rating Eligibility
        if (application.status !== 'ACCEPTED') {
            console.error(`❌ Rating Error: Application status is ${application.status}, not ACCEPTED. AppID: ${application._id}`);
            return res.status(400).json({ success: false, message: 'You can only rate after being hired (status must be ACCEPTED)' });
        }

        if (isEmployer && application.employerRated && existingReview) {
            return res.status(400).json({ success: false, message: 'ERR_ALREADY_RATED_BY_EMPLOYER' });
        }
        if (!isEmployer && application.employeeRated && existingReview) {
            return res.status(400).json({ success: false, message: 'ERR_ALREADY_RATED_BY_EMPLOYEE' });
        }

        console.log('🚀 Creating review doc...');
        // 4. Save Rating (Hidden)
        const review = await Review.create({
            reviewer: currentUserObjectId,
            reviewee: toUserObjectId,
            job: jobObjectId,
            stars,
            feedback: feedback || '',
            role,
            isPublished: false
        });
        console.log('✅ Review created:', review._id);

        // 5. Update Application Flags
        if (isEmployer) {
            application.employerRated = true;
        } else {
            application.employeeRated = true;
        }

        // 6. Check for Publish
        const otherPartyReview = await Review.findOne({
            reviewer: toUserObjectId,
            reviewee: currentUserObjectId,
            job: jobObjectId
        });

        let bothRated = false;
        if (otherPartyReview) {
            console.log('🔥 Both parties have now rated! Publishing both reviews...');
            review.isPublished = true;
            await review.save();
            otherPartyReview.isPublished = true;
            await otherPartyReview.save();
            application.ratingPublished = true;
            bothRated = true;

            // Background update stats (no need to block response)
            ratingService.updateUserRatingStats(currentUserObjectId).catch(e => console.error('Stats Update Error (User):', e));
            ratingService.updateUserRatingStats(toUserObjectId).catch(e => console.error('Stats Update Error (ToUser):', e));
        }

        console.log('💾 Final application save...');
        await application.save();

        res.status(201).json({
            success: true,
            message: bothRated
                ? 'Ratings published! Both parties have submitted.'
                : 'Rating submitted! It will remain hidden until the other party rates or 48 hours pass.',
            bothRated
        });

    } catch (error) {
        console.error('Submit Rating 500 Error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Failed to submit rating',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

/**
 * @desc    Get published ratings for a user
 * @route   GET /api/rating/user/:id
 * @access  Public
 */
exports.getUserRatings = async (req, res) => {
    try {
        // Run auto-publish check first
        await ratingService.autoPublishOldReviews();

        const ratings = await Review.find({
            reviewee: req.params.id,
            isPublished: true
        })
            .populate('reviewer', 'name profile.avatar')
            .populate('job', 'title company')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: ratings.length,
            ratings
        });
    } catch (error) {
        console.error('Get User Ratings Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
