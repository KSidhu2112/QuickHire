const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Job',
            required: [true, 'Job reference is required'],
        },
        jobseeker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Job seeker reference is required'],
        },
        employer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Employer reference is required'],
        },
        status: {
            type: String,
            enum: {
                values: ['APPLIED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
                message: '{VALUE} is not a valid application status',
            },
            default: 'APPLIED',
        },
        // Application Details
        coverLetter: {
            type: String,
            trim: true,
            maxlength: [1000, 'Cover letter cannot exceed 1000 characters'],
        },
        resumeUrl: {
            type: String,
            trim: true,
        },
        availability: {
            type: String,
            trim: true,
        },
        // Employer Feedback
        employerNotes: {
            type: String,
            trim: true,
            maxlength: [500, 'Employer notes cannot exceed 500 characters'],
        },
        reviewedAt: {
            type: Date,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
);

// New fields for Job Execution & Payment
applicationSchema.add({
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'HELD_IN_ESCROW', 'RELEASED', 'REFUNDED', 'DISPUTED'],
        default: 'PENDING',
    },
    workStatus: {
        type: String,
        enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED', 'CANCELLED'],
        default: 'PENDING',
    },
    // Dual Confirmation
    employerConfirmation: {
        confirmed: { type: Boolean, default: false },
        status: { type: String, enum: ['FULL', 'PARTIAL', 'NO_SHOW'] },
        rating: { type: Number, min: 1, max: 5 },
        feedback: String,
        proof: String, // URL
        timestamp: Date,
    },
    employeeConfirmation: {
        confirmed: { type: Boolean, default: false },
        status: { type: String, enum: ['FULL_PAYMENT', 'PARTIAL_PAYMENT', 'NOT_PAID'] },
        rating: { type: Number, min: 1, max: 5 },
        feedback: String,
        proof: String, // URL
        timestamp: Date,
    },
    dispute: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dispute',
    },
});

// Compound unique index: one application per job per jobseeker
applicationSchema.index({ job: 1, jobseeker: 1 }, { unique: true });

// Additional indexes for faster queries
applicationSchema.index({ jobseeker: 1, createdAt: -1 });
applicationSchema.index({ employer: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ paymentStatus: 1 });
applicationSchema.index({ workStatus: 1 });

// Pre-save middleware to set reviewedAt when status changes
applicationSchema.pre('save', async function () {
    if (this.isModified('status') && ['ACCEPTED', 'REJECTED'].includes(this.status)) {
        if (!this.reviewedAt) {
            this.reviewedAt = new Date();
        }
    }
});

// Method to accept application
applicationSchema.methods.accept = async function (employerId, notes = '') {
    this.status = 'ACCEPTED';
    this.employerNotes = notes;
    this.reviewedAt = new Date();
    this.reviewedBy = employerId;
    await this.save();
};

// Method to reject application
applicationSchema.methods.reject = async function (employerId, notes = '') {
    this.status = 'REJECTED';
    this.employerNotes = notes;
    this.reviewedAt = new Date();
    this.reviewedBy = employerId;
    await this.save();
};

// Method to withdraw application
applicationSchema.methods.withdraw = async function () {
    this.status = 'WITHDRAWN';
    await this.save();
};

// Static method to check if user already applied for a job
applicationSchema.statics.hasApplied = async function (jobId, jobseekerId) {
    const application = await this.findOne({ job: jobId, jobseeker: jobseekerId });
    return !!application;
};

// Static method to get application count for a job
applicationSchema.statics.getApplicationCount = async function (jobId) {
    return await this.countDocuments({ job: jobId });
};

// Static method to get accepted applications for a job
applicationSchema.statics.getAcceptedCount = async function (jobId) {
    return await this.countDocuments({ job: jobId, status: 'ACCEPTED' });
};

module.exports = mongoose.model('Application', applicationSchema);
