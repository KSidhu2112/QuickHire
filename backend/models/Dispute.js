const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: true,
        },
        application: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
            required: true,
        },
        raisedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        against: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        reason: {
            type: String,
            required: true,
            enum: ['NON_PAYMENT', 'NO_SHOW', 'POOR_WORK', 'OTHER'],
        },
        description: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        proofs: [String], // Array of URLs to images/docs
        status: {
            type: String,
            enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED'],
            default: 'OPEN',
        },
        resolution: {
            type: String,
            enum: ['REFUND_EMPLOYER', 'RELEASE_EMPLOYEE', 'SPLIT', 'DISMISSED'],
        },
        adminComments: {
            type: String,
        },
        resolvedAt: {
            type: Date,
        },
        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Admin
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Dispute', disputeSchema);
