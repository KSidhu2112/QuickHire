const Review = require('../models/Review');
const User = require('../models/User');
const Application = require('../models/Application');

/**
 * Updates a user's average rating, rating count, trust score, and badges based on their reviews.
 * Also calculates reliabilityScore.
 * @param {string} userId - The ID of the user to update.
 */
async function updateUserRatingStats(userId) {
    try {
        const reviews = await Review.find({ reviewee: userId, isPublished: true });
        const user = await User.findById(userId);
        if (!user) return;

        // Ensure stats object exists
        if (!user.stats) {
            user.stats = {
                jobsCompleted: 0,
                totalEarnings: 0,
                totalSpent: 0,
                disputesCount: 0,
                latePayments: 0,
                avgRating: 0,
                ratingCount: 0,
                totalRatings: 0,
                reliabilityScore: 70,
                jobsEnrolled: 0,
                totalJoined: 0,
                noShows: 0
            };
        }

        if (reviews.length === 0) {
            user.stats.avgRating = 0;
            user.stats.ratingCount = 0;
            user.stats.totalRatings = 0;
            user.stats.reliabilityScore = user.stats.reliabilityScore || 70; // Default base
        } else {
            // Handle both 'stars' (current) and legacy 'rating' if any
            const totalStars = reviews.reduce((sum, r) => sum + (r.stars || r.rating || 0), 0);
            const avgRating = totalStars / reviews.length;

            user.stats.avgRating = Math.round(avgRating * 10) / 10;
            user.stats.ratingCount = reviews.length;
            user.stats.totalRatings = reviews.length;

            // Calculate Reliability Score
            // Formula: (AvgRating * 12) + (CompletionRate * 40)
            // Completion Rate = jobsCompleted / jobsEnrolled
            const jobsCompleted = user.stats.jobsCompleted || 0;
            const jobsEnrolled = user.stats.jobsEnrolled || 1; // Prevent div by 0
            const completionRate = Math.min(1, jobsCompleted / Math.max(1, jobsEnrolled));

            // Penalty for no-shows
            const noShowPenalty = (user.stats.noShows || 0) * 5;

            const reliabilityScore = (avgRating * 12) + (completionRate * 40) - noShowPenalty;
            user.stats.reliabilityScore = Math.min(100, Math.max(0, Math.round(reliabilityScore)));

            // Update trust score based on ratings
            let trustScore = user.trustScore || 100;

            const lowRatings = reviews.filter(r => (r.stars || r.rating || 0) <= 2).length;
            if (lowRatings >= 3) {
                trustScore = Math.max(0, trustScore - (lowRatings * 3));
            }

            if (avgRating >= 4.5 && reviews.length >= 5) {
                trustScore = Math.min(100, trustScore + 5);
            }

            user.trustScore = trustScore;

            // Update badges
            const currentBadges = new Set(user.badges || []);
            if (user.isEmailVerified) currentBadges.add('VERIFIED');
            if (avgRating >= 4.5 && reviews.length >= 5) currentBadges.add('TOP_RATED');

            if (trustScore < 50) {
                currentBadges.add('RISKY');
                currentBadges.delete('MODERATE');
            } else if (trustScore < 80) {
                currentBadges.add('MODERATE');
                currentBadges.delete('RISKY');
            } else {
                currentBadges.delete('RISKY');
                currentBadges.delete('MODERATE');
            }

            user.badges = Array.from(currentBadges);
        }

        await user.save();
        console.log(`Updated rating stats for user ${userId}: Avg ${user.stats.avgRating}, Reliability ${user.stats.reliabilityScore}`);
    } catch (error) {
        console.error('Update User Rating Stats Error:', error);
    }
}

/**
 * Publishes reviews that are older than 48 hours and haven't been published yet.
 */
async function autoPublishOldReviews() {
    try {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        // Find single reviews older than 48h
        const unpublishedReviews = await Review.find({
            isPublished: false,
            createdAt: { $lte: fortyEightHoursAgo }
        });

        if (unpublishedReviews.length === 0) return;

        console.log(`Auto-publishing ${unpublishedReviews.length} reviews...`);

        for (const review of unpublishedReviews) {
            review.isPublished = true;
            await review.save();

            // Determine role to update correct flag
            const updateFields = { ratingPublished: true };
            if (review.role === 'Employer') {
                updateFields.employerRated = true;
            } else {
                updateFields.employeeRated = true;
            }

            // Update app flags for the correct pair
            await Application.findOneAndUpdate(
                { 
                    job: review.job, 
                    $or: [
                        { employer: review.reviewer, jobseeker: review.reviewee },
                        { jobseeker: review.reviewer, employer: review.reviewee }
                    ]
                },
                updateFields
            );

            // Update stats for the reviewee
            await updateUserRatingStats(review.reviewee);
        }
    } catch (error) {
        console.error('Auto Publish Reviews Error:', error);
    }
}

module.exports = {
    updateUserRatingStats,
    autoPublishOldReviews
};
