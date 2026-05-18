const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['ESCROW_HOLD', 'ESCROW_RELEASE', 'PAYMENT', 'REFUND'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    relatedJob: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job'
    },
    relatedApplication: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application'
    },
    description: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
