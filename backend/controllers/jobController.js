const Job = require('../models/Job');
const Application = require('../models/Application');
const { notifyJobPosted, notifyJobseekers } = require('../services/notificationService');

// @desc    Get all jobs with filters
// @route   GET /api/jobs
// @access  Public
exports.getJobs = async (req, res) => {
    try {
        const {
            jobType,
            city,
            date,
            salaryMin,
            salaryMax,
            experience,
            status = 'ACTIVE',
            page = 1,
            limit = 20,
            sort = '-createdAt',
        } = req.query;

        // Build query
        const query = { status };

        // Filter out jobs already applied by the jobseeker
        if (req.user && req.user.role === 'jobseeker') {
            const userApplications = await Application.find({ jobseeker: req.user._id }).select('job');
            const appliedJobIds = userApplications.map(app => app.job);
            query._id = { $nin: appliedJobIds };
        }

        if (jobType) {
            query.jobType = jobType.toUpperCase();
        }

        if (city) {
            query['location.city'] = { $regex: city, $options: 'i' };
        }

        // For daily jobs, filter by work date
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);

            const end = new Date(date);
            end.setHours(23, 59, 59, 999);

            query.workDate = {
                $gte: start,
                $lte: end,
            };
        }

        if (salaryMin) {
            query.salaryMin = { $gte: parseInt(salaryMin) };
        }

        if (salaryMax) {
            query.salaryMax = { $lte: parseInt(salaryMax) };
        }



        if (experience && experience !== 'ANY') {
            query.experience = experience.toUpperCase();
        }

        if (req.query.category && req.query.category !== 'ALL') {
            query.category = req.query.category.toUpperCase();
        }

        // Keyword Search (Title, Company, Description, Category)
        if (req.query.keyword) {
            const keyword = req.query.keyword;
            const keywordRegex = { $regex: keyword, $options: 'i' };

            // If other filters exist, we need to use $and to ensure everything matches
            // If status is the only filter so far (default), we can just add $or

            const searchConditions = [
                { title: keywordRegex },
                { company: keywordRegex },
                { description: keywordRegex },
                { category: keywordRegex }
            ];

            // If we have other queries besides status, strict filtering applies
            // But we want to intersect the keyword search with existing filters
            // We can add an $and clause where one element is the $or of search conditions

            if (!query.$and) {
                query.$and = [];
            }

            query.$and.push({ $or: searchConditions });
        }

        // Execute query with pagination
        // Execute query with pagination
        const skip = (page - 1) * limit;
        const jobs = await Job.find(query)
            .populate('employer', 'name email company')
            .sort(sort)
            .limit(parseInt(limit))
            .skip(skip);

        // Check if user has applied to any of these jobs
        let jobsWithStatus = jobs;
        if (req.user && req.user.role === 'jobseeker') {
            const jobIds = jobs.map(job => job._id);
            const applications = await Application.find({
                job: { $in: jobIds },
                jobseeker: req.user._id
            }).select('job');

            const appliedJobIds = new Set(applications.map(app => app.job.toString()));

            jobsWithStatus = jobs.map(job => {
                const jobObj = job.toObject();
                jobObj.hasApplied = appliedJobIds.has(jobObj._id.toString());
                return jobObj;
            });
        }

        // Get total count for pagination
        const total = await Job.countDocuments(query);

        res.status(200).json({
            success: true,
            count: jobsWithStatus.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            jobs: jobsWithStatus,
        });
    } catch (error) {
        console.error('Get Jobs Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch jobs',
            error: error.message,
        });
    }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id)
            .populate('employer', 'name email phone company profile');

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        // Increment view count
        await job.incrementViews();

        res.status(200).json({
            success: true,
            job,
        });
    } catch (error) {
        console.error('Get Job Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch job details',
            error: error.message,
        });
    }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer only)
exports.createJob = async (req, res) => {
    try {
        console.log('📝 Create Job Request Body:', JSON.stringify(req.body, null, 2));
        console.log('👤 User:', req.user.email, '- Role:', req.user.role);

        const jobData = {
            ...req.body,
            employer: req.user._id,
        };

        // Validate daily job fields
        if (jobData.jobType === 'DAILY') {
            if (!jobData.workDate || !jobData.startTime || !jobData.endTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Daily jobs require workDate, startTime, and endTime',
                });
            }
        }

        console.log('✅ Creating job with data:', JSON.stringify(jobData, null, 2));
        const job = await Job.create(jobData);
        console.log('✅ Job created successfully:', job._id);

        // Send notification to employer
        try {
            // await notifyJobPosted(req.user._id, job._id, job.title);
            // console.log('✅ Job posted notification sent to employer');

            // Broadcast to jobseekers
            await notifyJobseekers(job._id, job.title, job.company, job.category);
            console.log('✅ Job alert broadcasted to jobseekers');
        } catch (notifError) {
            console.error('Notification Error (non-fatal):', notifError);
        }

        res.status(201).json({
            success: true,
            message: 'Job posted successfully!',
            job,
        });
    } catch (error) {
        console.error('❌ Create Job Error:', error);
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            console.error('Validation Errors:', errors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors,
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create job',
            error: error.message,
        });
    }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer - own jobs only)
exports.updateJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        // Check ownership
        if (job.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this job',
            });
        }

        // Update fields
        const allowedUpdates = [
            'title',
            'description',
            'company',
            'salaryMin',
            'salaryMax',
            'salaryType',
            'location',
            'workDate',
            'startTime',
            'endTime',
            'workersRequired',
            'skills',
            'experience',
            'education',
            'status',
            'deadline',
            'isUrgent',
            'category',
            'foodProvided',
            'shift',
            'daysPerWeek',
            'workingHours',
            'joiningDate',
            'vacancyType',
            'autoApprove',
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                job[field] = req.body[field];
            }
        });

        await job.save();

        res.status(200).json({
            success: true,
            message: 'Job updated successfully',
            job,
        });
    } catch (error) {
        console.error('Update Job Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update job',
            error: error.message,
        });
    }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer - own jobs only)
exports.deleteJob = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        // Check ownership
        if (job.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this job',
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
        console.error('Delete Job Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete job',
            error: error.message,
        });
    }
};

// @desc    Get employer's jobs
// @route   GET /api/jobs/employer/my-jobs
// @access  Private (Employer only)
exports.getMyJobs = async (req, res) => {
    try {
        const { status, jobType, page = 1, limit = 10 } = req.query;

        const query = { employer: req.user._id };

        if (status) {
            query.status = status.toUpperCase();
        }

        if (jobType) {
            query.jobType = jobType.toUpperCase();
        }

        const skip = (page - 1) * limit;
        const jobs = await Job.find(query)
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip(skip);

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
        console.error('Get My Jobs Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your jobs',
            error: error.message,
        });
    }
};

// @desc    Get job statistics for employer
// @route   GET /api/jobs/:id/stats
// @access  Private (Employer - own jobs only)
exports.getJobStats = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        // Check ownership
        if (job.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this job',
            });
        }

        // Get application statistics
        const totalApplications = await Application.countDocuments({ job: job._id });
        const acceptedApplications = await Application.countDocuments({
            job: job._id,
            status: 'ACCEPTED',
        });
        const rejectedApplications = await Application.countDocuments({
            job: job._id,
            status: 'REJECTED',
        });
        const pendingApplications = await Application.countDocuments({
            job: job._id,
            status: { $in: ['APPLIED', 'UNDER_REVIEW'] },
        });

        res.status(200).json({
            success: true,
            stats: {
                views: job.views,
                totalApplications,
                acceptedApplications,
                rejectedApplications,
                pendingApplications,
                workersRequired: job.workersRequired,
                workersHired: job.workersHired,
            },
        });
    } catch (error) {
        console.error('Get Job Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch job statistics',
            error: error.message,
        });
    }
};
