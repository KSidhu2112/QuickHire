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
        shareContactInfo: {
            type: Boolean,
            default: true,
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
        // ===== WORK & PAYMENT VERIFICATION SYSTEM =====
        paymentStatus: {
            type: String,
            enum: ['PENDING', 'HELD_IN_ESCROW', 'RELEASED', 'REFUNDED', 'DISPUTED'],
            default: 'PENDING',
        },
        workStatus: {
            type: String,
            enum: ['PENDING', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'DISPUTED', 'CANCELLED'],
            default: 'PENDING',
        },
        workSubmission: {
            notes: String,
            proofs: [String],
            submittedAt: Date,
        },
        // Escrow Lock
        escrowAmount: {
            type: Number,
            default: 0,
        },
        escrowLockedAt: {
            type: Date,
        },
        escrowReleasedAt: {
            type: Date,
        },
        // Dual Confirmation
        employerConfirmation: {
            confirmed: { type: Boolean, default: false },
            status: { 
                type: String, 
                enum: {
                    values: ['FULL', 'PARTIAL', 'NO_SHOW', 'FULL_PAYMENT', 'PARTIAL_PAYMENT', 'NOT_PAID'],
                    message: '{VALUE} is not a valid confirmation status'
                }
            },
            rating: { type: Number, min: 1, max: 5 },
            feedback: String,
            proof: [String], // Array of URLs
            timestamp: Date,
        },
        employeeConfirmation: {
            confirmed: { type: Boolean, default: false },
            status: { 
                type: String, 
                enum: {
                    values: ['FULL', 'PARTIAL', 'NO_SHOW', 'FULL_PAYMENT', 'PARTIAL_PAYMENT', 'NOT_PAID'],
                    message: '{VALUE} is not a valid confirmation status'
                }
            },
            rating: { type: Number, min: 1, max: 5 },
            feedback: String,
            proof: [String], // Array of URLs
            timestamp: Date,
        },
        dispute: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dispute',
        },
        // ===== LEGAL EVIDENCE TIMELINE =====
        timeline: {
            jobAcceptedAt: Date,
            workStartedAt: Date,
            workCompletedAt: Date,
            paymentConfirmedAt: Date,
            employerConfirmedAt: Date,
            employeeConfirmedAt: Date,
            disputeRaisedAt: Date,
            disputeResolvedAt: Date,
        },
        // ===== PENALTY TRACKING =====
        penalty: {
            applied: { type: Boolean, default: false },
            percentage: { type: Number, default: 0 },
            amount: { type: Number, default: 0 },
            reason: String,
            appliedAt: Date,
        },
        // Reminder tracking
        remindersSent: {
            type: Number,
            default: 0,
        },
        lastReminderAt: {
            type: Date,
        },
        // Proof uploads for legal evidence
        proofUploads: [{
            uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            type: { type: String, enum: ['WORK_PROOF', 'PAYMENT_PROOF', 'OTHER'] },
            url: String,
            description: String,
            uploadedAt: { type: Date, default: Date.now },
        }],
        // ===== DOUBLE-BLIND RATING SYSTEM =====
        employerRated: {
            type: Boolean,
            default: false,
        },
        employeeRated: {
            type: Boolean,
            default: false,
        },
        ratingPublished: {
            type: Boolean,
            default: false,
        },
        // ===== JOINING CONFIRMATION SYSTEM =====
        joiningStatus: {
            type: String,
            enum: ['pending', 'joined', 'not_joined', 'disputed'],
            default: 'pending'
        },
        joiningDate: {
            type: Date,
        },
        joiningConfirmedAt: {
            type: Date,
        },
        joiningDisputeReason: {
            type: String,
            trim: true
        },
        // ===== PAYMENT REPORTING SYSTEM =====
        isPaid: {
            type: Boolean,
            default: false
        },
        paymentReceived: {
            type: Boolean,
            default: false
        },
        paymentReportedIssue: {
            type: Boolean,
            default: false
        },
        // ===== REAL-TIME VISIBILITY FIELDS (Requirement 8) =====
        work_status: {
            type: String,
            default: 'Pending'
        },
        work_completed_at: {
            type: Date
        },
        work_completed_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        payment_status: {
            type: String,
            default: 'Pending'
        },
        rating_status: {
            type: String,
            default: 'Pending'
        },
        complaint_status: {
            type: String,
            default: 'None'
        },
        // ===== TRUST FEATURE FIELDS =====
        trustDetails: {
            contactMobile: {
                type: String,
                trim: true,
            },
            paymentMethod: {
                type: String,
                enum: ['Payment Mobile Number', 'UPI ID'],
            },
            paymentValue: {
                type: String,
                trim: true,
            }
        }
    },
    {
        timestamps: true,
    }
);

// Compound unique index: one application per job per jobseeker
applicationSchema.index({ job: 1, jobseeker: 1 }, { unique: true });

// Additional indexes for faster queries
applicationSchema.index({ jobseeker: 1, createdAt: -1 });
applicationSchema.index({ employer: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ paymentStatus: 1 });
applicationSchema.index({ workStatus: 1 });
applicationSchema.index({ 'employerConfirmation.confirmed': 1, 'employeeConfirmation.confirmed': 1 });

// Pre-save middleware to set reviewedAt when status changes
applicationSchema.pre('save', async function () {
    if (this.isModified('status') && ['ACCEPTED', 'REJECTED'].includes(this.status)) {
        if (!this.reviewedAt) {
            this.reviewedAt = new Date();
        }
        // Set timeline accepted timestamp
        if (this.status === 'ACCEPTED' && !this.timeline?.jobAcceptedAt) {
            if (!this.timeline) this.timeline = {};
            this.timeline.jobAcceptedAt = new Date();
        }
    }
});

// Method to accept application
applicationSchema.methods.accept = async function (employerId, notes = '') {
    this.status = 'ACCEPTED';
    this.employerNotes = notes;
    this.reviewedAt = new Date();
    this.reviewedBy = employerId;
    if (!this.timeline) this.timeline = {};
    this.timeline.jobAcceptedAt = new Date();
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

// Static method to get pending payment confirmations (older than 48 hours)
applicationSchema.statics.getPendingPayments = async function () {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    return await this.find({
        status: 'ACCEPTED',
        workStatus: 'COMPLETED',
        'employeeConfirmation.confirmed': true,
        'employerConfirmation.confirmed': { $ne: true },
        'employeeConfirmation.timestamp': { $lte: fortyEightHoursAgo },
    }).populate('job employer jobseeker');
};

module.exports = mongoose.model('Application', applicationSchema);
