const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
    {
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        targetType: {
            type: String, // USER, JOB, APPLICATION, PAYMENT, REPORT, MESSAGE
            required: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        details: {
            type: Object,
        },
        ipAddress: String,
    },
    {
        timestamps: true,
    }
);

adminLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);
