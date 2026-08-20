const mongoose = require('mongoose');

const employerRatingSchema = new mongoose.Schema(
    {
        employer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true,
        },

        // Granular rating fields (1-5 scale)
        workQuality: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        punctuality: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        reliability: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        behavior: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        communication: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        // Overall rating (average of all fields)
        overallRating: {
            type: Number,
            default: 0,
        },

        // Written feedback
        feedback: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        // Would rehire?
        wouldRehire: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate ratings for the same job
employerRatingSchema.index({ employer: 1, employee: 1, job: 1 }, { unique: true });

// Calculate overall rating before save
employerRatingSchema.pre('save', function () {
    this.overallRating = parseFloat(
        ((this.workQuality + this.punctuality + this.reliability + this.behavior + this.communication) / 5).toFixed(1)
    );
});

module.exports = mongoose.model('EmployerRating', employerRatingSchema);
