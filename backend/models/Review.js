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
        stars: {
            type: Number,
            required: [true, 'Rating is required'],
            min: 1,
            max: 5,
        },
        feedback: {
            type: String,
            trim: true,
            maxlength: [300, 'Feedback cannot be more than 300 characters'],
        },
        role: {
            type: String,
            enum: ['Employer', 'Employee'],
            required: true,
        },
        isPublished: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate reviews for the same job between the same parties
reviewSchema.index({ reviewer: 1, reviewee: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
