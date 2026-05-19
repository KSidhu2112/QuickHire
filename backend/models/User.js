const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        role: {
            type: String,
            enum: ['jobseeker', 'employer', 'admin', 'employee', 'employ'],
            default: 'jobseeker',
        },
        status: {
            type: String,
            enum: ['active', 'blocked', 'suspended'],
            default: 'active',
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        phone: {
            type: String,
            trim: true,
        },
        profile: {
            avatar: String,
            bio: String,
            // Jobseeker fields
            skills: [String],
            experience: String,
            education: String,
            resume: String,
            // Employer fields
            company: String,
            businessType: String,
            location: String,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        // Wallet & Reputation
        walletBalance: {
            type: Number,
            default: 0,
        },
        trustScore: {
            type: Number,
            default: 100, // Start with a neutral/good score
            min: 0,
            max: 100,
        },
        badges: {
            type: [String],
            enum: ['VERIFIED', 'MODERATE', 'RISKY', 'TOP_RATED'],
            default: [],
        },
        stats: {
            jobsCompleted: { type: Number, default: 0 },
            totalEarnings: { type: Number, default: 0 }, // For employees
            totalSpent: { type: Number, default: 0 }, // For employers
            disputesCount: { type: Number, default: 0 },
            latePayments: { type: Number, default: 0 },
            avgRating: { type: Number, default: 0 },
            ratingCount: { type: Number, default: 0 },
            totalRatings: { type: Number, default: 0 },
            reliabilityScore: { type: Number, default: 0 },
            jobsEnrolled: { type: Number, default: 0 },
            totalJoined: { type: Number, default: 0 },
            noShows: { type: Number, default: 0 },
            // Employer specific stats
            totalJobsPosted: { type: Number, default: 0 },
            paymentConfirmedCount: { type: Number, default: 0 },
            validComplaints: { type: Number, default: 0 },
            reliabilityPercentage: { type: Number, default: 100 },
        },
        blacklisted: {
            isBlacklisted: { type: Boolean, default: false },
            reason: String,
            bannedAt: Date,
        },
        embedding: {
            type: [Number],
            default: undefined
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Auto-generate embeddings for jobseekers (workers) on creation or profile updates
userSchema.pre('save', async function () {
    if (this.role === 'jobseeker') {
        const profileModified = this.isModified('profile') || 
                                this.isModified('name') || 
                                this.isModified('role') ||
                                this.isNew;
                                
        if (profileModified) {
            try {
                const embeddingService = require('../services/embeddingService');
                const text = embeddingService.buildWorkerProfileText(this);
                this.embedding = await embeddingService.generateEmbedding(text);
                console.log(`🤖 Auto-generated embedding vector (length ${this.embedding.length}) for worker: ${this.name}`);
            } catch (err) {
                console.error('⚠️ Error generating worker profile embedding in pre-save:', err.message);
            }
        }
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

module.exports = mongoose.model('User', userSchema);
