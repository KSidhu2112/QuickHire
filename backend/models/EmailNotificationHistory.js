const mongoose = require('mongoose');

const emailNotificationHistorySchema = new mongoose.Schema(
    {
        recipientEmail: { type: String, required: true },
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
        sentAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

// Compound index to prevent duplicate emails for the same job
emailNotificationHistorySchema.index({ recipientEmail: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('EmailNotificationHistory', emailNotificationHistorySchema);
