const User = require('../models/User');

const Job = require('../models/Job');

// Get all job seekers (employees)
exports.getJobSeekers = async (req, res) => {
    try {
        const { search } = req.query;
        let query = { role: 'jobseeker' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const jobSeekers = await User.find(query).select('-password');
        res.status(200).json({
            success: true,
            count: jobSeekers.length,
            data: jobSeekers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get all employers
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

        const employers = await User.find(query).select('-password');
        res.status(200).json({
            success: true,
            count: employers.length,
            data: employers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get all users (general admin view)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

const Application = require('../models/Application');

// Get dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const employerCount = await User.countDocuments({ role: 'employer' });
        const jobSeekerCount = await User.countDocuments({ role: 'jobseeker' });
        const activeJobCount = await Job.countDocuments({ status: 'ACTIVE' });

        res.status(200).json({
            success: true,
            data: {
                employers: employerCount,
                employees: jobSeekerCount,
                jobs: activeJobCount
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get employer details (jobs and hired employees)
exports.getEmployerDetails = async (req, res) => {
    try {
        const employerId = req.params.id;

        // Fetch employer basic info
        const employer = await User.findById(employerId).select('-password');
        if (!employer) {
            return res.status(404).json({ success: false, message: 'Employer not found' });
        }

        // Fetch jobs posted by employer
        const jobs = await Job.find({ employer: employerId }).sort('-createdAt');

        // Fetch accepted applications (hired employees)
        const hiredApplications = await Application.find({
            employer: employerId,
            status: 'ACCEPTED'
        })
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
                    hiredDate: app.reviewedAt
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching employer details:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: error.message
        });
    }
};

// Get all jobs (admin view with filters and pagination)
exports.getAllJobs = async (req, res) => {
    try {
        const {
            status,
            jobType,
            keyword,
            page = 1,
            limit = 10,
        } = req.query;

        // Build query
        const query = {};

        if (status && status !== 'ALL') {
            query.status = status.toUpperCase();
        }

        if (jobType && jobType !== 'ALL') {
            query.jobType = jobType.toUpperCase();
        }

        // Keyword search
        if (keyword) {
            const keywordRegex = { $regex: keyword, $options: 'i' };
            query.$or = [
                { title: keywordRegex },
                { company: keywordRegex },
                { description: keywordRegex },
                { category: keywordRegex }
            ];
        }

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const jobs = await Job.find(query)
            .populate('employer', 'name email company')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip(skip);

        // Get total count for pagination
        const total = await Job.countDocuments(query);

        res.status(200).json({
            success: true,
            count: jobs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            jobs,
        });
    } catch (error) {
        console.error('Get All Jobs Error (Admin):', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs',
            error: error.message,
        });
    }
};

// Delete any job (admin only - bypasses ownership check)
exports.deleteAnyJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        // Delete all applications for this job
        await Application.deleteMany({ job: job._id });

        // Delete the job
        await job.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Job and related applications deleted successfully',
        });
    } catch (error) {
        console.error('Delete Job Error (Admin):', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete job',
            error: error.message,
        });
    }
};

