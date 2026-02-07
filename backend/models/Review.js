const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
    {
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reviewee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true,
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [500, 'Comment cannot be more than 500 characters'],
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate reviews for the same job by the same reviewer
reviewSchema.index({ reviewer: 1, reviewee: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
