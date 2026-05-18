const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Recipient is required'],
            index: true,
        },
        type: {
            type: String,
            enum: [
                // Employer notifications
                'JOB_POSTED',
                'NEW_APPLICATION',
                'MULTIPLE_APPLICATIONS',
                'CANDIDATE_SHORTLISTED',
                'CANDIDATE_REJECTED',
                'JOB_EXPIRED',
                'JOB_CLOSED',
                'INTERVIEW_SCHEDULED',
                'NO_APPLICATIONS_REMINDER',
                // Employee notifications
                'JOB_ALERT',
                'APPLICATION_SUBMITTED',
                'APPLICATION_VIEWED',
                'SHORTLISTED',
                'INTERVIEW_INVITATION',
                'APPLICATION_REJECTED',
                'JOB_RECOMMENDATION',
                'JOB_CLOSED_APPLIED',
                'PROFILE_COMPLETION',
                // System notifications
                'LOGIN_ALERT',
                'ACCOUNT_CREATED',
                'SYSTEM_UPDATE',
                // Verification System notifications
                'WORK_CONFIRMED',
                'PAYMENT_CONFIRMED',
                'WORK_COMPLETION_REMINDER',
                'PAYMENT_REMINDER',
                'ESCROW_LOCKED',
                'ESCROW_RELEASED',
                'PENALTY_APPLIED',
                'DISPUTE_OPENED',
                'DISPUTE_RESOLVED',
                'LATE_PAYMENT_WARNING',
                'ADMIN_ALERT',
            ],
            required: true,
        },
        title: {
            type: String,
            required: [true, 'Notification title is required'],
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Notification message is required'],
            trim: true,
        },
        icon: {
            type: String,
            default: '🔔',
        },
        // Related entities
        relatedJob: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
        },
        relatedApplication: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
        },
        relatedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        // Metadata
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        // Status
        read: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
        },
        // Action link (optional)
        actionUrl: {
            type: String,
            trim: true,
        },
        priority: {
            type: String,
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
            default: 'MEDIUM',
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for faster queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

// Auto-delete old notifications (older than 90 days)
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Method to mark as read
notificationSchema.methods.markAsRead = async function () {
    if (!this.read) {
        this.read = true;
        this.readAt = new Date();
        await this.save();
    }
};

// Static method to create notification
notificationSchema.statics.createNotification = async function (data) {
    try {
        const notification = await this.create(data);
        return notification;
    } catch (error) {
        console.error('Create Notification Error:', error);
        throw error;
    }
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function (userId) {
    return await this.countDocuments({ recipient: userId, read: false });
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsRead = async function (userId) {
    return await this.updateMany(
        { recipient: userId, read: false },
        { $set: { read: true, readAt: new Date() } }
    );
};

module.exports = mongoose.model('Notification', notificationSchema);
