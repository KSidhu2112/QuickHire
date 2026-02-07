const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        otp: {
            type: String,
            required: true,
        },
        purpose: {
            type: String,
            enum: ['registration', 'password-reset', 'email-verification'],
            default: 'registration',
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 }, // Auto-delete when expired
        },
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 600, // Auto-delete after 10 minutes
        },
    }
);

// Index for faster queries
otpSchema.index({ email: 1, otp: 1 });

module.exports = mongoose.model('OTP', otpSchema);
