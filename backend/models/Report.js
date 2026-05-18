const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reportedType: {
            type: String,
            enum: ['USER', 'JOB', 'APPLICATION', 'PAYMENT'],
            required: true,
        },
        reportedId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        reason: {
            type: String,
            required: true,
            enum: ['SPAM', 'FAKE_JOB', 'FRAUD', 'HARASSMENT', 'PAYMENT_DISPUTE', 'MISCONDUCT', 'OTHER'],
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        proofs: [String],
        status: {
            type: String,
            enum: ['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'],
            default: 'PENDING',
        },
        adminRemarks: {
            type: String,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        resolvedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

reportSchema.index({ status: 1 });
reportSchema.index({ reportedType: 1, reportedId: 1 });

module.exports = mongoose.model('Report', reportSchema);
