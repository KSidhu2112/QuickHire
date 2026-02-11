const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'ESCROW_HOLD', 'ESCROW_RELEASE', 'PENALTY', 'REFUND'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: 'INR',
        },
        status: {
            type: String,
            enum: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
            default: 'PENDING',
        },
        relatedJob: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
        },
        relatedApplication: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
        },
        description: {
            type: String,
            trim: true,
        },
        transactionId: {
            type: String,
            unique: true,
        },
    },
    {
        timestamps: true,
    }
);

// Helper to generate transaction ID
transactionSchema.pre('save', function (next) {
    if (!this.transactionId) {
        this.transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
    next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
