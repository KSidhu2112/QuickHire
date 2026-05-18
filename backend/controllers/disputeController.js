const Dispute = require('../models/Dispute');
const Application = require('../models/Application');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const {
    notifyDisputeOpened,
    notifyDisputeResolved,
    notifyPenaltyApplied,
    notifyAdmin,
} = require('../services/notificationService');

// Get all disputes (Admin or Filtered)
exports.getDisputes = async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 20 } = req.query;
        let query = {};

        if (req.user.role !== 'admin') {
            // If not admin, only show my disputes
            query.$or = [{ raisedBy: req.user._id }, { against: req.user._id }];
        }

        if (status) query.status = status;
        if (priority) query.priority = priority;

        const skip = (page - 1) * limit;
        const disputes = await Dispute.find(query)
            .populate('job', 'title company')
            .populate('raisedBy', 'name email trustScore')
            .populate('against', 'name email trustScore')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Dispute.countDocuments(query);

        // Get stats
        const openCount = await Dispute.countDocuments({ ...query, status: 'OPEN' });
        const reviewCount = await Dispute.countDocuments({ ...query, status: 'UNDER_REVIEW' });
        const resolvedCount = await Dispute.countDocuments({ ...query, status: 'RESOLVED' });

        res.status(200).json({
            success: true,
            count: disputes.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            stats: { open: openCount, underReview: reviewCount, resolved: resolvedCount },
            data: disputes,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single dispute details
exports.getDisputeDetails = async (req, res) => {
    try {
        const dispute = await Dispute.findById(req.params.id)
            .populate('job')
            .populate({
                path: 'application',
                populate: [
                    { path: 'job', select: 'title company salaryMin salaryMax' },
                    { path: 'jobseeker', select: 'name email trustScore stats badges' },
                    { path: 'employer', select: 'name email trustScore stats badges' },
                ],
            })
            .populate('raisedBy', 'name email trustScore stats badges')
            .populate('against', 'name email trustScore stats badges')
            .populate('resolvedBy', 'name email')
            .populate('adminActions.admin', 'name email');

        if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

        res.status(200).json({ success: true, data: dispute });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Raise a dispute manually
exports.raiseDispute = async (req, res) => {
    try {
        const { applicationId, reason, description, proofs } = req.body;

        const application = await Application.findById(applicationId)
            .populate('job', 'title')
            .populate('jobseeker', 'name')
            .populate('employer', 'name');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const isEmployer = application.employer._id.toString() === req.user._id.toString();
        const isJobseeker = application.jobseeker._id.toString() === req.user._id.toString();

        if (!isEmployer && !isJobseeker) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Check for existing open dispute
        const existingDispute = await Dispute.findOne({
            application: applicationId,
            status: { $in: ['OPEN', 'UNDER_REVIEW'] },
        });

        if (existingDispute) {
            return res.status(400).json({ success: false, message: 'An active dispute already exists for this application' });
        }

        const againstUser = isEmployer ? application.jobseeker._id : application.employer._id;

        const dispute = await Dispute.create({
            job: application.job._id,
            application: applicationId,
            raisedBy: req.user._id,
            against: againstUser,
            reason,
            description,
            proofs: proofs || [],
            status: 'OPEN',
            priority: reason === 'FRAUD' ? 'CRITICAL' : (reason === 'NON_PAYMENT' ? 'HIGH' : 'MEDIUM'),
        });

        // Update application
        application.workStatus = 'DISPUTED';
        application.paymentStatus = 'DISPUTED';
        application.dispute = dispute._id;
        if (!application.timeline) application.timeline = {};
        application.timeline.disputeRaisedAt = new Date();
        await application.save();

        // Update user dispute count
        const raisedByUser = await User.findById(req.user._id);
        if (raisedByUser) {
            raisedByUser.stats.disputesCount = (raisedByUser.stats.disputesCount || 0) + 1;
            await raisedByUser.save();
        }

        // Notify the other party
        try {
            const raisedByName = isEmployer ? application.employer.name : application.jobseeker.name;
            await notifyDisputeOpened(
                againstUser,
                application.job._id,
                applicationId,
                application.job.title,
                raisedByName
            );

            // Notify admins
            const admins = await User.find({ role: 'admin' }).select('_id');
            for (const admin of admins) {
                await notifyAdmin(admin._id, `New dispute: ${application.job.title} — Reason: ${reason}. Raised by: ${raisedByName}`);
            }
        } catch (e) { console.error('Notification error:', e); }

        res.status(201).json({
            success: true,
            message: 'Dispute raised successfully',
            data: dispute,
        });
    } catch (error) {
        console.error('Raise Dispute Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Resolve Dispute (Admin Only)
exports.resolveDispute = async (req, res) => {
    try {
        const { resolution, adminComments, penaltyTo, penaltyPercentage, isFakeComplaint } = req.body;
        const dispute = await Dispute.findById(req.params.id)
            .populate({
                path: 'application',
                populate: [
                    { path: 'job', select: 'title salaryMin salaryMax' },
                    { path: 'jobseeker', select: 'name email' },
                    { path: 'employer', select: 'name email' },
                ],
            });

        if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

        dispute.resolution = resolution;
        dispute.adminComments = adminComments;
        dispute.status = 'RESOLVED';
        dispute.resolvedAt = new Date();
        dispute.resolvedBy = req.user._id;
        dispute.isFakeComplaint = isFakeComplaint || false;

        // Add admin action
        if (!dispute.adminActions) dispute.adminActions = [];
        dispute.adminActions.push({
            action: `Resolved: ${resolution}`,
            comment: adminComments,
            admin: req.user._id,
            timestamp: new Date(),
        });

        // Handle funds based on resolution
        const application = dispute.application;

        if (resolution === 'RELEASE_EMPLOYEE') {
            application.paymentStatus = 'RELEASED';
            application.workStatus = 'COMPLETED';

            // Reduce employer trust score automatically if complaint marked valid
            const againstUser = await User.findById(dispute.against);
            if (againstUser && (againstUser.role === 'employer' || againstUser.role === 'jobseeker')) {
                againstUser.trustScore = Math.max(0, againstUser.trustScore - 10);
                if (againstUser.role === 'employer') {
                    againstUser.stats.validComplaints = (againstUser.stats.validComplaints || 0) + 1;
                    // Recalculate reliability
                    if (againstUser.stats.jobsCompleted > 0) {
                        againstUser.stats.reliabilityPercentage = Math.round(
                            ((againstUser.stats.paymentConfirmedCount || 0) / againstUser.stats.jobsCompleted) * 100
                        );
                    }
                }
                await againstUser.save();
            }
        } else if (resolution === 'REFUND_EMPLOYER') {
            application.paymentStatus = 'REFUNDED';
            application.workStatus = 'CANCELLED';
        } else if (resolution === 'SPLIT') {
            application.paymentStatus = 'RELEASED';
            application.workStatus = 'COMPLETED';
        }

        if (!application.timeline) application.timeline = {};
        application.timeline.disputeResolvedAt = new Date();

        // Apply penalty if specified
        if (penaltyTo && penaltyPercentage) {
            const penaltyUser = await User.findById(penaltyTo);
            if (penaltyUser) {
                penaltyUser.trustScore = Math.max(0, penaltyUser.trustScore - (penaltyPercentage / 2));
                await penaltyUser.save();

                dispute.penaltyApplied = {
                    to: penaltyTo,
                    percentage: penaltyPercentage,
                    reason: adminComments,
                };

                try {
                    await notifyPenaltyApplied(penaltyTo, dispute.job, application._id, adminComments, penaltyPercentage);
                } catch (e) { console.error('Penalty notification error:', e); }
            }
        }

        // Handle fake complaint
        if (isFakeComplaint) {
            const raisedBy = await User.findById(dispute.raisedBy);
            if (raisedBy) {
                raisedBy.trustScore = Math.max(0, raisedBy.trustScore - 15);
                await raisedBy.save();
            }
        }

        await dispute.save();
        await application.save();

        // Notify both parties
        try {
            const jobTitle = application.job?.title || 'Job';
            await notifyDisputeResolved(dispute.raisedBy, dispute.job, application._id, jobTitle, resolution);
            await notifyDisputeResolved(dispute.against, dispute.job, application._id, jobTitle, resolution);
        } catch (e) { console.error('Notification error:', e); }

        res.status(200).json({ success: true, message: 'Dispute resolved successfully', data: dispute });
    } catch (error) {
        console.error('Resolve Dispute Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update dispute status (Admin) - for moving to UNDER_REVIEW etc.
exports.updateDisputeStatus = async (req, res) => {
    try {
        const { status, comment } = req.body;
        const dispute = await Dispute.findById(req.params.id);

        if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

        dispute.status = status;
        if (!dispute.adminActions) dispute.adminActions = [];
        dispute.adminActions.push({
            action: `Status changed to: ${status}`,
            comment: comment || '',
            admin: req.user._id,
            timestamp: new Date(),
        });

        await dispute.save();

        res.status(200).json({ success: true, message: `Dispute status updated to ${status}`, data: dispute });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ===== ADMIN MONITORING ENDPOINTS =====

// Get monitoring dashboard stats
exports.getMonitoringStats = async (req, res) => {
    try {
        const pendingPayments = await Application.countDocuments({
            status: 'ACCEPTED',
            'employeeConfirmation.confirmed': true,
            'employerConfirmation.confirmed': { $ne: true },
        });

        const openDisputes = await Dispute.countDocuments({ status: { $in: ['OPEN', 'UNDER_REVIEW'] } });
        const totalDisputes = await Dispute.countDocuments();
        const resolvedDisputes = await Dispute.countDocuments({ status: 'RESOLVED' });
        const fakeComplaints = await Dispute.countDocuments({ isFakeComplaint: true });

        // Employers with multiple complaints
        const employerComplaints = await Dispute.aggregate([
            { $group: { _id: '$against', count: { $sum: 1 } } },
            { $match: { count: { $gte: 2 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    name: '$user.name',
                    email: '$user.email',
                    role: '$user.role',
                    trustScore: '$user.trustScore',
                },
            },
        ]);

        // Users with fake complaints
        const fakeComplaintUsers = await Dispute.aggregate([
            { $match: { isFakeComplaint: true } },
            { $group: { _id: '$raisedBy', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user',
                },
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    name: '$user.name',
                    email: '$user.email',
                    role: '$user.role',
                    trustScore: '$user.trustScore',
                },
            },
        ]);

        // Pending payment applications with details
        const pendingPaymentApps = await Application.find({
            status: 'ACCEPTED',
            'employeeConfirmation.confirmed': true,
            'employerConfirmation.confirmed': { $ne: true },
        })
            .populate('job', 'title company')
            .populate('employer', 'name email trustScore')
            .populate('jobseeker', 'name email')
            .sort('-employeeConfirmation.timestamp')
            .limit(20);

        // Penalties applied
        const penaltiesApplied = await Application.countDocuments({ 'penalty.applied': true });

        // Low trust score users
        const riskyUsers = await User.find({ trustScore: { $lt: 50 } })
            .select('name email role trustScore stats badges')
            .sort('trustScore')
            .limit(20);

        res.status(200).json({
            success: true,
            data: {
                pendingPayments,
                openDisputes,
                totalDisputes,
                resolvedDisputes,
                fakeComplaints,
                penaltiesApplied,
                employerComplaints,
                fakeComplaintUsers,
                pendingPaymentApps,
                riskyUsers,
            },
        });
    } catch (error) {
        console.error('Get Monitoring Stats Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// @desc    Report payment issue (Complaint Form)
// @route   POST /api/disputes/report-payment
// @access  Private (Job Seeker only)
exports.reportPaymentIssue = async (req, res) => {
    try {
        const { applicationId, issueType, description, proofs } = req.body;

        const application = await Application.findById(applicationId)
            .populate('job', 'title')
            .populate('employer', 'name email');

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Prevent abuse: Employee can report only if hired for that job
        if (application.jobseeker.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (application.status !== 'ACCEPTED') {
            return res.status(400).json({ success: false, message: 'You can only report issues for jobs you were hired for' });
        }

        // Prevent abuse: One complaint per job
        const existingDispute = await Dispute.findOne({
            application: applicationId,
            raisedBy: req.user._id
        });

        if (existingDispute) {
            return res.status(400).json({ success: false, message: 'You have already filed a complaint for this job' });
        }

        const dispute = await Dispute.create({
            job: application.job._id,
            application: applicationId,
            raisedBy: req.user._id,
            against: application.employer._id,
            reason: issueType, // e.g. PAYMENT_DELAYED
            description,
            proofs: proofs || [],
            status: 'PENDING',
            priority: issueType === 'PAYMENT_NOT_GIVEN' ? 'HIGH' : 'MEDIUM'
        });

        application.paymentReportedIssue = true;
        application.complaint_status = issueType;
        application.dispute = dispute._id;
        await application.save();

        // Update user dispute count
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.disputesCount': 1 } });

        res.status(201).json({
            success: true,
            message: 'Your complaint has been registered. Admin will review it soon.',
            dispute
        });
    } catch (error) {
        console.error('Report Payment Issue Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
