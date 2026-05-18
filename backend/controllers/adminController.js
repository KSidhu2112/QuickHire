const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');
const Message = require('../models/Message');
const Report = require('../models/Report');
const AdminLog = require('../models/AdminLog');

// Helper for admin logging
const logAdminAction = async (adminId, action, targetType, targetId, details) => {
    try {
        await AdminLog.create({
            admin: adminId,
            action,
            targetType,
            targetId,
            details
        });
    } catch (err) {
        console.error('Admin Log Error:', err);
    }
};

// 1. User Management
exports.getJobSeekers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = { role: 'jobseeker' };
        if (search) {
            query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
        }
        const users = await User.find(query).select('-password').sort('-createdAt');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.getEmployers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = { role: 'employer' };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'profile.company': { $regex: search, $options: 'i' } }
            ];
        }
        const users = await User.find(query).select('-password').sort('-createdAt');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { status } = req.body; // active, suspended, blocked
        const user = await User.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await logAdminAction(req.user._id, `UPDATED_STATUS_${status}`, 'USER', user._id, { oldStatus: user.status });

        res.status(200).json({ success: true, message: `User account ${status}`, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        await logAdminAction(req.user._id, 'DELETED_USER', 'USER', req.params.id, { email: user.email });

        res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// 2. Job Management
exports.getAllJobs = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = {};
        if (status && status !== 'ALL') query.status = status;
        if (search) {
            query.$or = [{ title: { $regex: search, $options: 'i' } }, { 'profile.company': { $regex: search, $options: 'i' } }];
        }
        const jobs = await Job.find(query).populate('employer', 'name email').sort('-createdAt');
        res.status(200).json({ success: true, count: jobs.length, data: jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.updateJobStatus = async (req, res) => {
    try {
        const { status } = req.body; // APPROVED, REJECTED, SUSPICIOUS, CLOSED
        const job = await Job.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

        await logAdminAction(req.user._id, `UPDATED_JOB_STATUS_${status}`, 'JOB', job._id, { oldStatus: job.status });

        res.status(200).json({ success: true, message: `Job ${status}`, data: job });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.deleteAnyJob = async (req, res) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

        await Application.deleteMany({ job: req.params.id });
        await logAdminAction(req.user._id, 'DELETED_JOB', 'JOB', req.params.id, { title: job.title });

        res.status(200).json({ success: true, message: 'Job and related applications deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// 3. Application Tracking
exports.getAllApplications = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status && status !== 'ALL') query.status = status;

        const apps = await Application.find(query)
            .populate('job', 'title')
            .populate('jobseeker', 'name email phone')
            .populate('employer', 'name email phone')
            .select('+trustDetails +joiningStatus +joiningDate +workStatus +isPaid +paymentReceived +work_status +payment_status +rating_status')
            .sort('-createdAt');

        res.status(200).json({ success: true, count: apps.length, data: apps });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// 4. Payment Monitoring
exports.getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .populate('userId', 'name email role')
            .populate('jobId', 'title')
            .sort('-createdAt');

        // Calculate totals from Payment model
        const stats = await Payment.aggregate([
            {
                $group: {
                    _id: {
                        $cond: [
                            { $in: ['$status', ['Success', 'completed']] },
                            'COMPLETED',
                            {
                                $cond: [
                                    { $in: ['$status', ['Failed', 'failed']] },
                                    'FAILED',
                                    'PENDING'
                                ]
                            }
                        ]
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalRevenue = payments
            .filter(p => p.status === 'Success' || p.paymentStatus === 'completed')
            .reduce((sum, p) => sum + p.amount, 0);

        res.status(200).json({
            success: true,
            data: payments,
            summary: {
                stats,
                platformRevenue: totalRevenue
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// 7. Analytics Dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = {
            totalUsers: await User.countDocuments(),
            totalEmployers: await User.countDocuments({ role: 'employer' }),
            totalEmployees: await User.countDocuments({ role: 'jobseeker' }),
            totalJobs: await Job.countDocuments(),
            totalApplications: await Application.countDocuments(),
            completedJobs: await Job.countDocuments({ status: 'COMPLETED' }),
            activeJobs: await Job.countDocuments({ status: 'ACTIVE' }),
        };

        // Aggregations for charts (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const jobsPerDay = await Job.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const registrationsPerDay = await User.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                stats,
                charts: {
                    jobsPerDay,
                    registrationsPerDay
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// 8. Fraud Detection / Reports
exports.getAllReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'name email')
            .sort('-createdAt');
        res.status(200).json({ success: true, data: reports });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { status, adminRemarks } = req.body;
        const report = await Report.findByIdAndUpdate(req.params.id, {
            status,
            adminRemarks,
            resolvedBy: req.user._id,
            resolvedAt: Date.now()
        }, { new: true });

        res.status(200).json({ success: true, data: report });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// 6. Communication Logs
exports.getCommunicationLogs = async (req, res) => {
    try {
        const { jobId } = req.query;
        let query = {};
        if (jobId) query.job = jobId;

        const logs = await Message.find(query)
            .populate('sender', 'name email role')
            .populate('receiver', 'name email role')
            .populate('job', 'title')
            .sort('-createdAt');

        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort('-createdAt');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.getEmployerDetails = async (req, res) => {
    try {
        const employerId = req.params.id;
        const employer = await User.findById(employerId).select('-password');
        if (!employer) return res.status(404).json({ success: false, message: 'Employer not found' });
        const jobs = await Job.find({ employer: employerId }).sort('-createdAt');
        const hiredApplications = await Application.find({ employer: employerId, status: 'ACCEPTED' })
            .populate('jobseeker', 'name email profile')
            .populate('job', 'title');

        res.status(200).json({
            success: true,
            data: {
                employer,
                jobs,
                hiredEmployees: hiredApplications.map(app => ({
                    ...app.jobseeker.toObject(),
                    hiredForJob: app.job.title,
                    jobId: app.job._id,
                    hiredDate: app.reviewedAt,
                    employerRated: app.employerRated,
                    employeeRated: app.employeeRated,
                    employerWorkConfirmed: app.employerConfirmation?.confirmed || false,
                    employeeWorkConfirmed: app.employeeConfirmation?.confirmed || false,
                    employerPaidStatus: app.isPaid || false,
                    employeePaidStatus: app.paymentReceived || false
                }))
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

exports.getEmployeeDetails = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const employee = await User.findById(employeeId).select('-password');
        if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

        const applications = await Application.find({ jobseeker: employeeId })
            .populate('job', 'title budget status')
            .populate('employer', 'name email profile')
            .sort('-createdAt');

        const transactions = await Transaction.find({ user: employeeId })
            .populate('relatedJob', 'title')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            data: {
                employee,
                applications: applications.map(app => ({
                    jobId: app.job?._id,
                    jobTitle: app.job?.title,
                    status: app.status,
                    appliedDate: app.createdAt,
                    employerId: app.employer?._id,
                    employerName: app.employer?.name,
                    employerEmail: app.employer?.email,
                    employerCompany: app.employer?.profile?.company,
                    employerRated: app.employerRated,
                    employeeRated: app.employeeRated,
                    employerWorkConfirmed: app.employerConfirmation?.confirmed || false,
                    employeeWorkConfirmed: app.employeeConfirmation?.confirmed || false,
                    employerPaidStatus: app.isPaid || false,
                    employeePaidStatus: app.paymentReceived || false
                })),
                paymentHistory: transactions
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};
