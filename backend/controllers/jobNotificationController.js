const JobNotification = require('../models/JobNotification');
const Job = require('../models/Job');
const { sendJobAlertEmails } = require('../services/emailService');
const User = require('../models/User');

// @desc    Trigger notifications manually for a job
// @route   POST /api/notifications/job/:jobId/trigger
// @access  Private (Employer/Admin)
exports.triggerJobNotifications = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (req.user.role !== 'admin' && job.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Fire and forget generic emails to all employees
        setImmediate(async () => {
            const activeEmployees = await User.find({
                role: 'jobseeker',
                status: 'active',
                email: { $exists: true, $ne: '' }
            }).select('_id email name');

            if (activeEmployees.length > 0) {
                await sendJobAlertEmails(activeEmployees, job);
            }
        });

        res.status(200).json({
            success: true,
            message: 'Generic job notifications process started successfully',
        });
    } catch (error) {
        console.error('Trigger Job Notifications Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger notifications',
            error: error.message,
        });
    }
};

// @desc    View notification statistics for a job
// @route   GET /api/notifications/job/:jobId/stats
// @access  Private (Employer/Admin)
exports.getJobNotificationStats = async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (req.user.role !== 'admin' && job.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const stats = await JobNotification.aggregate([
            { $match: { jobId: job._id } },
            {
                $group: {
                    _id: null,
                    totalSent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
                    totalFailed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                    totalPending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                    totalMatched: { $sum: 1 },
                }
            }
        ]);

        const result = stats.length > 0 ? stats[0] : { totalSent: 0, totalFailed: 0, totalPending: 0, totalMatched: 0 };

        res.status(200).json({
            success: true,
            stats: {
                totalNotificationsSent: result.totalSent,
                totalFailed: result.totalFailed,
                totalPending: result.totalPending,
                totalMatchedAlgorithms: result.totalMatched,
                openRatePlaceholder: 'N/A (Implementation via pixel tracking future update)'
            }
        });
    } catch (error) {
        console.error('Get Job Notification Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get stats',
            error: error.message,
        });
    }
};

// @desc    View all employees notified for a job
// @route   GET /api/notifications/job/:jobId/employees
// @access  Private (Employer/Admin)
exports.getNotifiedEmployeesForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (req.user.role !== 'admin' && job.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const notifications = await JobNotification.find({ jobId: job._id })
            .populate('employeeId', 'name email profile expectedSalary')
            .sort({ matchScore: -1 });

        res.status(200).json({
            success: true,
            count: notifications.length,
            notifications
        });
    } catch (error) {
        console.error('Get Notified Employees Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notified employees',
            error: error.message,
        });
    }
};

// @desc    Retry failed notifications
// @route   POST /api/notifications/job/:jobId/retry
// @access  Private (Employer/Admin)
exports.retryFailedNotifications = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job.findById(jobId);

        if (!job) {
            return res.status(404).json({ success: false, message: 'Job not found' });
        }

        if (req.user.role !== 'admin' && job.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const failedNotifications = await JobNotification.find({ jobId: job._id, status: 'failed' }).populate('employeeId');

        if (failedNotifications.length === 0) {
            return res.status(200).json({ success: true, message: 'No failed notifications to retry' });
        }

        const employeesToNotify = failedNotifications.map(n => n.employeeId).filter(Boolean);

        const { sendJobAlertEmails } = require('../services/emailService');

        setImmediate(async () => {
            await sendJobAlertEmails(employeesToNotify, job);
        });

        res.status(200).json({
            success: true,
            message: `Retrying ${employeesToNotify.length} failed notifications in the background`
        });
    } catch (error) {
        console.error('Retry Failed Notifications Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retry notifications',
            error: error.message,
        });
    }
};
