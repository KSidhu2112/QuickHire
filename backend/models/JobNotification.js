const mongoose = require('mongoose');

const jobNotificationSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
        required: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    email: {
        type: String,
        required: true
    },
    matchScore: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    },
    sentAt: {
        type: Date
    },
    errorMessage: {
        type: String
    }
}, { timestamps: true });

// Ensure unique job-employee pair so we don't spam
jobNotificationSchema.index({ jobId: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model('JobNotification', jobNotificationSchema);
