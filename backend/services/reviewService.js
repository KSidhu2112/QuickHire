const Review = require('../models/Review');
const Application = require('../models/Application');
const { updateUserRatingStats } = require('./ratingService');

/**
 * Automatically publishes reviews that have been hidden for more than 48 hours.
 */
async function autoPublishReviews() {
    try {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

        // Find unpublished reviews older than 48 hours
        const reviewsToPublish = await Review.find({
            isPublished: false,
            createdAt: { $lte: fortyEightHoursAgo }
        });

        if (reviewsToPublish.length === 0) {
            return;
        }

        console.log(`⏰ Auto-publishing ${reviewsToPublish.length} reviews...`);

        const revieweeIds = new Set();

        for (const review of reviewsToPublish) {
            review.isPublished = true;
            await review.save();

            // Update application flag
            await Application.findOneAndUpdate(
                { job: review.job, $or: [{ jobseeker: review.reviewer }, { employer: review.reviewer }] },
                { ratingPublished: true }
            );

            revieweeIds.add(review.reviewee.toString());
        }

        // Update stats for all affected users
        for (const userId of revieweeIds) {
            await updateUserRatingStats(userId);
        }

        console.log(`✅ Finished auto-publishing reviews.`);
    } catch (error) {
        console.error('❌ Error in autoPublishReviews:', error);
    }
}

module.exports = {
    autoPublishReviews
};
