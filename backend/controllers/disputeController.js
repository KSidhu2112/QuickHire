const Dispute = require('../models/Dispute');
const Application = require('../models/Application');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get all disputes (Admin or Filtered)
exports.getDisputes = async (req, res) => {
    try {
        const { status, role } = req.query;
        let query = {};

        if (req.user.role !== 'admin') {
            // If not admin, only show my disputes
            query.$or = [{ raisedBy: req.user.id }, { against: req.user.id }];
        }

        if (status) query.status = status;

        const disputes = await Dispute.find(query)
            .populate('job', 'title')
            .populate('raisedBy', 'name email')
            .populate('against', 'name email')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: disputes.length, data: disputes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get single dispute details
exports.getDisputeDetails = async (req, res) => {
    try {
        const dispute = await Dispute.findById(req.params.id)
            .populate('job')
            .populate('application')
            .populate('raisedBy')
            .populate('against');

        if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

        res.status(200).json({ success: true, data: dispute });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Resolve Dispute (Admin Only)
exports.resolveDispute = async (req, res) => {
    try {
        const { resolution, adminComments } = req.body;
        const dispute = await Dispute.findById(req.params.id).populate('application');

        if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

        dispute.resolution = resolution;
        dispute.adminComments = adminComments;
        dispute.status = 'RESOLVED';
        dispute.resolvedAt = Date.now();
        dispute.resolvedBy = req.user.id; // Admin ID

        await dispute.save();

        // Handle funds based on resolution
        const application = dispute.application;
        const employerId = dispute.raisedBy.toString() === application.employer.toString() ? dispute.raisedBy : dispute.against;
        const jobseekerId = dispute.raisedBy.toString() === application.jobseeker.toString() ? dispute.raisedBy : dispute.against;

        // Fetch employer and jobseeker users to update trust scores/wallets if needed
        const employer = await User.findById(employerId);
        const jobseeker = await User.findById(jobseekerId);

        // Assume funds are currently HELD_IN_ESCROW or similar state (implied) in Wallet System
        // Logic for fund transfer would go here

        if (resolution === 'RELEASE_EMPLOYEE') {
            // Transfer funds to Employee
            // ... Wallet Logic
            application.paymentStatus = 'RELEASED';
            application.workStatus = 'COMPLETED';
        } else if (resolution === 'REFUND_EMPLOYER') {
            // Refund Logic
            application.paymentStatus = 'REFUNDED';
            application.workStatus = 'CANCELLED';
        }

        await application.save();

        res.status(200).json({ success: true, message: 'Dispute resolved successfully', data: dispute });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
