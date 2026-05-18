const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');

// @desc    Get employer dashboard stats
// @route   GET /api/employer/dashboard/stats
// @access  Private (Employer only)
exports.getDashboardStats = async (req, res) => {
    try {
        const employerId = req.user._id;

        // Total jobs posted
        const totalJobs = await Job.countDocuments({ employer: employerId });

        // Active jobs
        const activeJobs = await Job.countDocuments({
            employer: employerId,
            status: 'ACTIVE',
        });

        // Total applications received
        const totalApplications = await Application.countDocuments({
            employer: employerId,
        });

        // Employees hired (accepted applications)
        const employeesHired = await Application.countDocuments({
            employer: employerId,
            status: 'ACCEPTED',
        });

        // Today's daily jobs
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaysDailyJobs = await Job.countDocuments({
            employer: employerId,
            jobType: 'DAILY',
            workDate: { $gte: today, $lt: tomorrow },
        });

        // Applications per job type
        const jobsByType = await Job.aggregate([
            { $match: { employer: employerId } },
            {
                $group: {
                    _id: '$jobType',
                    count: { $sum: 1 },
                    totalApplicants: { $sum: '$applicants' },
                },
            },
        ]);

        // Recent applications (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentApplications = await Application.countDocuments({
            employer: employerId,
            createdAt: { $gte: sevenDaysAgo },
        });

        // Pending applications
        const pendingApplications = await Application.countDocuments({
            employer: employerId,
            status: 'APPLIED',
        });

        res.status(200).json({
            success: true,
            stats: {
                totalJobs,
                activeJobs,
                totalApplications,
                employeesHired,
                todaysDailyJobs,
                recentApplications,
                pendingApplications,
                jobsByType,
            },
        });
    } catch (error) {
        console.error('Get Dashboard Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message,
        });
    }
};

// @desc    Get all applications for employer
// @route   GET /api/employer/applications
// @access  Private (Employer only)
exports.getAllApplications = async (req, res) => {
    try {
        const employerId = req.user._id;
        const { status, jobType, page = 1, limit = 20 } = req.query;

        const query = { employer: employerId };

        if (status) {
            query.status = status.toUpperCase();
        }

        const skip = (page - 1) * limit;

        let applications = await Application.find(query)
            .populate('job', 'title company jobType location salaryMin salaryMax workDate status')
            .populate('jobseeker', 'name email phone profile stats trustScore')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip(skip);

        // Filter by job type if specified
        if (jobType) {
            applications = applications.filter(
                (app) => app.job.jobType === jobType.toUpperCase()
            );
        }

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
        console.error('Get All Applications Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch applications',
            error: error.message,
        });
    }
};

// @desc    Shortlist an application
// @route   PUT /api/employer/applications/:id/shortlist
// @access  Private (Employer only)
exports.shortlistApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('job')
            .populate('jobseeker', 'name email phone');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Check authorization
        if (application.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        application.status = 'UNDER_REVIEW';
        application.reviewedAt = new Date();
        application.reviewedBy = req.user._id;
        await application.save();

        res.status(200).json({
            success: true,
            message: 'Application shortlisted successfully',
            application,
        });
    } catch (error) {
        console.error('Shortlist Application Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to shortlist application',
            error: error.message,
        });
    }
};

// @desc    Get hired employees
// @route   GET /api/employer/hired-employees
// @access  Private (Employer only)
exports.getHiredEmployees = async (req, res) => {
    try {
        const employerId = req.user._id;
        const { page = 1, limit = 20 } = req.query;

        const skip = (page - 1) * limit;

        const hiredEmployees = await Application.find({
            employer: employerId,
            status: 'ACCEPTED',
        })
            .populate('job', 'title company jobType workDate location')
            .populate('jobseeker', 'name email phone profile stats trustScore')
            .sort('-updatedAt')
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Application.countDocuments({
            employer: employerId,
            status: 'ACCEPTED',
        });

        res.status(200).json({
            success: true,
            count: hiredEmployees.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            employees: hiredEmployees,
        });
    } catch (error) {
        console.error('Get Hired Employees Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch hired employees',
            error: error.message,
        });
    }
};

// @desc    Mark employee attendance (for daily jobs)
// @route   PUT /api/employer/attendance/:applicationId
// @access  Private (Employer only)
exports.markAttendance = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { isPresent, notes } = req.body;

        const application = await Application.findById(applicationId)
            .populate('job')
            .populate('jobseeker', 'name email');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Check authorization
        if (application.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        // Check if it's a daily job and accepted
        if (application.job.jobType !== 'DAILY' || application.status !== 'ACCEPTED') {
            return res.status(400).json({
                success: false,
                message: 'Attendance can only be marked for accepted daily jobs',
            });
        }

        // Update attendance (you can create a separate Attendance model later)
        // For now, we'll use employerNotes field
        application.employerNotes = `Attendance: ${isPresent ? 'Present' : 'Absent'}. ${notes || ''}`;
        await application.save();

        res.status(200).json({
            success: true,
            message: 'Attendance marked successfully',
            application,
        });
    } catch (error) {
        console.error('Mark Attendance Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark attendance',
            error: error.message,
        });
    }
};

// @desc    Get payment summary
// @route   GET /api/employer/payments
// @access  Private (Employer only)
exports.getPaymentSummary = async (req, res) => {
    try {
        const employerId = req.user._id;

        // Get all accepted applications
        const acceptedApplications = await Application.find({
            employer: employerId,
            status: 'ACCEPTED',
        })
            .populate('job', 'title salaryMin salaryMax salaryType jobType workDate')
            .populate('jobseeker', 'name email phone');

        // Calculate total wages
        let totalWages = 0;
        const paymentDetails = acceptedApplications.map((app) => {
            const wage = app.job.salaryMin || 0;
            totalWages += wage;

            return {
                jobseeker: app.jobseeker.name,
                job: app.job.title,
                jobType: app.job.jobType,
                wage,
                salaryType: app.job.salaryType,
                hiredDate: app.updatedAt,
                workDate: app.job.workDate,
            };
        });

        res.status(200).json({
            success: true,
            totalWages,
            totalEmployees: acceptedApplications.length,
            payments: paymentDetails,
        });
    } catch (error) {
        console.error('Get Payment Summary Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment summary',
            error: error.message,
        });
    }
};

// @desc    Update employer profile
// @route   PUT /api/employer/profile
// @access  Private (Employer only)
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, company, businessType, location } = req.body;

        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Update fields
        if (name) user.name = name;
        if (phone) user.phone = phone;

        // Initialize profile if it doesn't exist
        if (!user.profile) user.profile = {};

        if (company) user.profile.company = company;
        if (businessType) user.profile.businessType = businessType;
        if (location) user.profile.location = location;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                profile: user.profile,
            },
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message,
        });
    }
};

module.exports = exports;
