const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Review = require('../models/Review');
const Dispute = require('../models/Dispute');
const Transaction = require('../models/Transaction');
const {
    notifyWorkConfirmed,
    notifyPaymentConfirmed,
    notifyWorkSubmitted,
    notifyWorkCompletionReminder,
    notifyPaymentReminder,
    notifyEscrowLocked,
    notifyEscrowReleased,
    notifyPenaltyApplied,
    notifyDisputeOpened,
    notifyDisputeResolved,
    notifyLatePaymentWarning,
    notifyAdmin,
} = require('../services/notificationService');

// ===== 1. DUAL CONFIRMATION SYSTEM =====

// @desc    Start work on a job (Employee marks work as started)
// @route   POST /api/verification/:applicationId/start-work
// @access  Private (Job Seeker only)
exports.startWork = async (req, res) => {
    try {
        const application = await Application.findById(req.params.applicationId).populate('job');
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        if (application.jobseeker.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (application.status !== 'ACCEPTED') {
            return res.status(400).json({ success: false, message: 'Application must be in ACCEPTED status to start work' });
        }

        application.workStatus = 'IN_PROGRESS';
        if (!application.timeline) application.timeline = {};
        application.timeline.workStartedAt = new Date();
        await application.save();

        res.status(200).json({
            success: true,
            message: 'Work started successfully',
            application,
        });
    } catch (error) {
        console.error('Start Work Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Employee submits work for review
// @route   POST /api/verification/:applicationId/submit-work
// @access  Private (Job Seeker only)
exports.submitWork = async (req, res) => {
    try {
        const { notes, proofs } = req.body;
        const application = await Application.findById(req.params.applicationId)
            .populate('job')
            .populate('employer', 'name email')
            .populate('jobseeker', 'name email');

        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
        if (application.jobseeker._id.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });
        if (application.status !== 'ACCEPTED') return res.status(400).json({ success: false, message: 'Application not accepted' });

        application.workStatus = 'SUBMITTED';
        application.workSubmission = {
            notes,
            proofs: proofs || [],
            submittedAt: new Date(),
        };

        if (!application.timeline) application.timeline = {};
        // Add to timeline if needed, for now rely on workStatus change

        await application.save();

        // Notify employer
        try {
            await notifyWorkSubmitted(
                application.employer._id,
                application.job._id,
                application._id,
                application.job.title,
                application.jobseeker.name
            );
        } catch (e) { console.error('Notification error:', e); }

        res.status(200).json({ success: true, message: 'Work submitted for review', application });
    } catch (error) {
        console.error('Submit Work Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Employer confirms work completion
// @route   POST /api/verification/:applicationId/employer-confirm
// @access  Private (Employer only)
exports.employerConfirm = async (req, res) => {
    try {
        const { status, rating, feedback, proof } = req.body;
        const application = await Application.findById(req.params.applicationId)
            .populate('job')
            .populate('jobseeker', 'name email')
            .populate('employer', 'name email');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        if (application.employer._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (application.status !== 'ACCEPTED') {
            return res.status(400).json({ success: false, message: 'Application not in correct state' });
        }

        // Set employer confirmation
        application.employerConfirmation = {
            confirmed: true,
            status: status || 'FULL',
            rating: rating || null,
            feedback: feedback || '',
            proof: proof || [],
            timestamp: new Date(),
        };

        if (!application.timeline) application.timeline = {};
        application.timeline.employerConfirmedAt = new Date();

        // Update real-time status
        if (application.employeeConfirmation?.confirmed) {
            application.work_status = 'Completed';
        } else {
            application.work_status = 'Pending Employee Confirmation';
        }

        // Increment no-show count if applicable
        if (status === 'NO_SHOW') {
            await User.findByIdAndUpdate(application.jobseeker._id, { $inc: { 'stats.noShows': 1 } });
        }

        // Check if both have confirmed
        await handleDualConfirmation(application);
        await application.save();

        // NOTE: Legacy auto-review logic removed. Ratings are now handled 
        // separately via the dedicated reviews endpoint.

        // Notify employee
        try {
            await notifyWorkConfirmed(
                application.jobseeker._id,
                application.job._id,
                application._id,
                application.job.title,
                application.employer.name
            );
        } catch (e) { console.error('Notification error:', e); }

        res.status(200).json({
            success: true,
            message: 'Work completion confirmed by employer',
            application,
        });
    } catch (error) {
        console.error('Employer Confirm Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Employee confirms payment received
// @route   POST /api/verification/:applicationId/employee-confirm
// @access  Private (Job Seeker only)
exports.employeeConfirm = async (req, res) => {
    try {
        const { status, rating, feedback, proof } = req.body;
        const application = await Application.findById(req.params.applicationId)
            .populate('job')
            .populate('jobseeker', 'name email')
            .populate('employer', 'name email');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        if (application.jobseeker._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (application.status !== 'ACCEPTED') {
            return res.status(400).json({ success: false, message: 'Application not in correct state' });
        }

        // Set employee confirmation
        application.employeeConfirmation = {
            confirmed: true,
            status: status || 'FULL_PAYMENT',
            rating: rating || null,
            feedback: feedback || '',
            proof: proof || [],
            timestamp: new Date(),
        };

        if (!application.timeline) application.timeline = {};
        application.timeline.employeeConfirmedAt = new Date();

        // Update real-time status
        if (application.employerConfirmation?.confirmed) {
            application.work_status = 'Completed';
        } else {
            application.work_status = 'Pending Employer Confirmation';
        }

        // Check if both have confirmed
        await handleDualConfirmation(application);
        await application.save();

        // NOTE: Legacy auto-review logic removed. Ratings are now handled 
        // separately via the dedicated reviews endpoint.

        // Notify employer
        try {
            await notifyPaymentConfirmed(
                application.employer._id,
                application.job._id,
                application._id,
                application.job.title,
                application.escrowAmount || ''
            );
        } catch (e) { console.error('Notification error:', e); }

        res.status(200).json({
            success: true,
            message: 'Payment received confirmed by employee',
            application,
        });
    } catch (error) {
        console.error('Employee Confirm Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Handle dual confirmation logic
async function handleDualConfirmation(application) {
    if (!application.employerConfirmation?.confirmed || !application.employeeConfirmation?.confirmed) {
        return; // Wait for both
    }

    const empStatus = application.employerConfirmation.status;
    const seekerStatus = application.employeeConfirmation.status;

    // Case 1: Both agree — Full completion & Full payment
    const isFullEmp = empStatus === 'FULL' || empStatus === 'FULL_PAYMENT';
    const isFullSeeker = seekerStatus === 'FULL' || seekerStatus === 'FULL_PAYMENT';

    if (isFullEmp && isFullSeeker) {
        application.workStatus = 'COMPLETED';
        application.paymentStatus = 'RELEASED';
        application.work_status = 'Completed';
        application.payment_status = 'Paid';
        application.timeline.workCompletedAt = new Date();
        application.timeline.paymentConfirmedAt = new Date();

        // Release escrow if locked
        if (application.escrowAmount > 0) {
            await releaseEscrow(application);
        }

        // Update user stats
        await updateCompletionStats(application);
    }
    // Case 2: Mismatch — Auto Dispute
    else {
        application.workStatus = 'DISPUTED';
        application.paymentStatus = 'DISPUTED';

        const dispute = await Dispute.create({
            job: application.job._id || application.job,
            application: application._id,
            raisedBy: application.jobseeker._id || application.jobseeker,
            against: application.employer._id || application.employer,
            reason: seekerStatus === 'NOT_PAID' ? 'NON_PAYMENT' : 'OTHER',
            description: `Auto-generated dispute. Employer says: ${empStatus}, Employee says: ${seekerStatus}`,
            status: 'OPEN',
            isAutoGenerated: true,
            priority: seekerStatus === 'NOT_PAID' ? 'HIGH' : 'MEDIUM',
        });

        application.dispute = dispute._id;
        application.timeline.disputeRaisedAt = new Date();

        // Notify relevant admin(s)
        try {
            const admins = await User.find({ role: 'admin' }).select('_id');
            for (const admin of admins) {
                await notifyAdmin(admin._id, `Auto-dispute: ${application.job.title || 'Job'} — Employer: ${empStatus}, Employee: ${seekerStatus}`);
            }
        } catch (e) { console.error('Admin notification error:', e); }
    }
}

// ===== 2. ESCROW SYSTEM =====

// @desc    Lock payment in escrow
// @route   POST /api/verification/:applicationId/lock-escrow
// @access  Private (Employer only)
exports.lockEscrow = async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        const application = await Application.findById(req.params.applicationId)
            .populate('job')
            .populate('jobseeker', 'name');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        if (application.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        if (application.status !== 'ACCEPTED') {
            return res.status(400).json({ success: false, message: 'Application must be accepted first' });
        }

        // Lock escrow
        application.escrowAmount = amount;
        application.escrowLockedAt = new Date();
        application.paymentStatus = 'HELD_IN_ESCROW';

        // Deduct from employer wallet
        const employer = await User.findById(application.employer);
        if (employer.walletBalance < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
        }
        employer.walletBalance -= amount;
        await employer.save();

        // Create transaction record
        await Transaction.create({
            user: employer._id,
            type: 'ESCROW_HOLD',
            amount: -amount,
            status: 'COMPLETED',
            relatedJob: application.job._id,
            relatedApplication: application._id,
            description: `Escrow hold for job: ${application.job.title}`,
        });

        await application.save();

        // Notify both parties
        try {
            await notifyEscrowLocked(application.employer.toString(), application.job._id, application._id, application.job.title, amount);
            await notifyEscrowLocked(application.jobseeker._id || application.jobseeker, application.job._id, application._id, application.job.title, amount);
        } catch (e) { console.error('Notification error:', e); }

        res.status(200).json({
            success: true,
            message: `₹${amount} locked in escrow`,
            application,
        });
    } catch (error) {
        console.error('Lock Escrow Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Internal function to release escrow
async function releaseEscrow(application) {
    try {
        const amount = application.escrowAmount;
        const jobseekerId = application.jobseeker._id || application.jobseeker;
        const employerId = application.employer._id || application.employer;

        // Credit to employee wallet
        const employee = await User.findById(jobseekerId);
        if (employee) {
            employee.walletBalance += amount;
            employee.stats.totalEarnings += amount;
            await employee.save();
        }

        // Update employer stats
        const employer = await User.findById(employerId);
        if (employer) {
            employer.stats.totalSpent += amount;
            await employer.save();
        }

        // Create transaction records
        await Transaction.create({
            user: jobseekerId,
            type: 'ESCROW_RELEASE',
            amount: amount,
            status: 'COMPLETED',
            relatedJob: application.job._id || application.job,
            relatedApplication: application._id,
            description: `Escrow release for completed job`,
        });

        application.escrowReleasedAt = new Date();
        application.paymentStatus = 'RELEASED';

        // Notify
        const jobTitle = application.job?.title || 'Job';
        await notifyEscrowReleased(jobseekerId, application.job._id || application.job, application._id, jobTitle, amount);
    } catch (error) {
        console.error('Release Escrow Error:', error);
    }
}

// ===== 3. AUTO PENALTY SYSTEM =====

// @desc    Check and apply penalties for late confirmations (called by cron or manually)
// @route   POST /api/verification/check-penalties
// @access  Private (Admin only)
exports.checkAndApplyPenalties = async (req, res) => {
    try {
        const { runPenaltyCheck } = require('../services/penaltyService');
        const results = await runPenaltyCheck();

        res.status(200).json({
            success: true,
            message: 'Penalty check completed',
            results,
        });
    } catch (error) {
        console.error('Check Penalties Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// NOTE: Legacy createOrUpdateReview and updateUserTrustScore helper functions removed.
// Rating statistics are now managed by ratingService.js.

async function updateCompletionStats(application) {
    try {
        const jobseekerId = application.jobseeker._id || application.jobseeker;
        const employerId = application.employer._id || application.employer;

        const jobseeker = await User.findById(jobseekerId);
        if (jobseeker) {
            jobseeker.stats.jobsCompleted = (jobseeker.stats.jobsCompleted || 0) + 1;
            await jobseeker.save();
        }
        const employer = await User.findById(employerId);
        if (employer) {
            employer.stats.jobsCompleted = (employer.stats.jobsCompleted || 0) + 1;
            await employer.save();
        }
    } catch (error) {
        console.error('Update Completion Stats Error:', error);
    }
}

// ===== 5. GET VERIFICATION STATUS =====

// @desc    Get verification status for an application
// @route   GET /api/verification/:applicationId
// @access  Private (Employer or Job Seeker)
exports.getVerificationStatus = async (req, res) => {
    try {
        const application = await Application.findById(req.params.applicationId)
            .populate('job', 'title company salaryMin salaryMax')
            .populate('jobseeker', 'name email phone profile trustScore stats badges')
            .populate('employer', 'name email profile trustScore stats badges')
            .populate('dispute');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const isEmployer = application.employer._id.toString() === req.user._id.toString();
        const isJobseeker = application.jobseeker._id.toString() === req.user._id.toString();

        if (!isEmployer && !isJobseeker && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        res.status(200).json({
            success: true,
            application,
        });
    } catch (error) {
        console.error('Get Verification Status Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all verifications for employer
// @route   GET /api/verification/employer/all
// @access  Private (Employer only)
exports.getEmployerVerifications = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {
            employer: req.user._id,
            status: 'ACCEPTED',
        };

        if (status === 'pending') {
            query.$or = [
                { 'employerConfirmation.confirmed': { $ne: true } },
                { 'employeeConfirmation.confirmed': { $ne: true } },
            ];
        } else if (status === 'completed') {
            query.workStatus = 'COMPLETED';
        } else if (status === 'disputed') {
            query.workStatus = 'DISPUTED';
        }

        const skip = (page - 1) * limit;
        const applications = await Application.find(query)
            .populate('job', 'title company salaryMin salaryMax')
            .populate('jobseeker', 'name email phone profile trustScore')
            .sort('-updatedAt')
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Application.countDocuments(query);

        res.status(200).json({
            success: true,
            count: applications.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            applications,
        });
    } catch (error) {
        console.error('Get Employer Verifications Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get all verifications for employee
// @route   GET /api/verification/employee/all
// @access  Private (Job Seeker only)
exports.getEmployeeVerifications = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const query = {
            jobseeker: req.user._id,
            status: 'ACCEPTED',
        };

        if (status === 'pending') {
            query.$or = [
                { 'employerConfirmation.confirmed': { $ne: true } },
                { 'employeeConfirmation.confirmed': { $ne: true } },
            ];
        } else if (status === 'completed') {
            query.workStatus = 'COMPLETED';
        } else if (status === 'disputed') {
            query.workStatus = 'DISPUTED';
        }

        const skip = (page - 1) * limit;
        const applications = await Application.find(query)
            .populate('job', 'title company salaryMin salaryMax')
            .populate('employer', 'name email profile trustScore')
            .sort('-updatedAt')
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Application.countDocuments(query);

        res.status(200).json({
            success: true,
            count: applications.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            applications,
        });
    } catch (error) {
        console.error('Get Employee Verifications Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Upload proof
// @route   POST /api/verification/:applicationId/upload-proof
// @access  Private
exports.uploadProof = async (req, res) => {
    try {
        const { type, url, description } = req.body;
        const application = await Application.findById(req.params.applicationId);

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const isEmployer = application.employer.toString() === req.user._id.toString();
        const isJobseeker = application.jobseeker.toString() === req.user._id.toString();

        if (!isEmployer && !isJobseeker) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (!application.proofUploads) application.proofUploads = [];
        application.proofUploads.push({
            uploadedBy: req.user._id,
            type: type || 'OTHER',
            url,
            description: description || '',
            uploadedAt: new Date(),
        });

        await application.save();

        res.status(200).json({
            success: true,
            message: 'Proof uploaded successfully',
            proofs: application.proofUploads,
        });
    } catch (error) {
        console.error('Upload Proof Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get timeline/legal evidence for an application
// @route   GET /api/verification/:applicationId/timeline
// @access  Private
exports.getTimeline = async (req, res) => {
    try {
        const application = await Application.findById(req.params.applicationId)
            .populate('job', 'title company')
            .populate('jobseeker', 'name email')
            .populate('employer', 'name email')
            .populate('dispute');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const isEmployer = application.employer._id.toString() === req.user._id.toString();
        const isJobseeker = application.jobseeker._id.toString() === req.user._id.toString();

        if (!isEmployer && !isJobseeker && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Build timeline events
        const events = [];

        if (application.createdAt) {
            events.push({ event: 'Application Submitted', timestamp: application.createdAt, icon: '📝' });
        }
        if (application.timeline?.jobAcceptedAt) {
            events.push({ event: 'Application Accepted', timestamp: application.timeline.jobAcceptedAt, icon: '✅' });
        }
        if (application.timeline?.workStartedAt) {
            events.push({ event: 'Work Started', timestamp: application.timeline.workStartedAt, icon: '🔨' });
        }
        if (application.timeline?.employerConfirmedAt) {
            events.push({ event: 'Employer Confirmed Work', timestamp: application.timeline.employerConfirmedAt, icon: '👔' });
        }
        if (application.timeline?.employeeConfirmedAt) {
            events.push({ event: 'Employee Confirmed Payment', timestamp: application.timeline.employeeConfirmedAt, icon: '👷' });
        }
        if (application.timeline?.workCompletedAt) {
            events.push({ event: 'Work Completed', timestamp: application.timeline.workCompletedAt, icon: '🎉' });
        }
        if (application.timeline?.paymentConfirmedAt) {
            events.push({ event: 'Payment Confirmed', timestamp: application.timeline.paymentConfirmedAt, icon: '💰' });
        }
        if (application.timeline?.disputeRaisedAt) {
            events.push({ event: 'Dispute Raised', timestamp: application.timeline.disputeRaisedAt, icon: '⚠️' });
        }
        if (application.timeline?.disputeResolvedAt) {
            events.push({ event: 'Dispute Resolved', timestamp: application.timeline.disputeResolvedAt, icon: '✅' });
        }
        if (application.escrowLockedAt) {
            events.push({ event: `Escrow Locked (₹${application.escrowAmount})`, timestamp: application.escrowLockedAt, icon: '🔒' });
        }
        if (application.escrowReleasedAt) {
            events.push({ event: 'Escrow Released', timestamp: application.escrowReleasedAt, icon: '🔓' });
        }
        if (application.penalty?.applied) {
            events.push({ event: `Penalty Applied (${application.penalty.percentage}%)`, timestamp: application.penalty.appliedAt, icon: '⚠️' });
        }

        // Sort events by timestamp
        events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.status(200).json({
            success: true,
            application: {
                _id: application._id,
                job: application.job,
                jobseeker: application.jobseeker,
                employer: application.employer,
                workStatus: application.workStatus,
                paymentStatus: application.paymentStatus,
                employerConfirmation: application.employerConfirmation,
                employeeConfirmation: application.employeeConfirmation,
                dispute: application.dispute,
                penalty: application.penalty,
                proofUploads: application.proofUploads,
            },
            timeline: events,
        });
    } catch (error) {
        console.error('Get Timeline Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

async function updateCompletionStats(application) {
    try {
        const seekerId = application.jobseeker._id || application.jobseeker;
        const employerId = application.employer._id || application.employer;

        if (seekerId) await User.findByIdAndUpdate(seekerId, { $inc: { 'stats.jobsCompleted': 1 } });
        if (employerId) await User.findByIdAndUpdate(employerId, { $inc: { 'stats.jobsCompleted': 1 } });
    } catch (error) {
        console.error('Update Stats Error:', error);
    }
}
