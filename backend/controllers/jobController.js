const mongoose = require('mongoose');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const Payment = require('../models/Payment');
const fs = require('fs');
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

            const searchConditions = [
                { title: keywordRegex },
                { company: keywordRegex },
                { description: keywordRegex },
                { category: keywordRegex }
            ];

            if (!query.$and) {
                query.$and = [];
            }

            query.$and.push({ $or: searchConditions });
        }

        // Execute query with pagination
        const skip = (page - 1) * limit;
        const jobs = await Job.find(query)
            .populate('employer', 'name email phone company stats trustScore')
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
        const { id } = req.params;

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Job ID format',
            });
        }

        const job = await Job.findById(id)
            .populate('employer', 'name email phone company profile stats trustScore');

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        // Increment view count (non-blocking, don't fail request if it fails)
        try {
            await job.incrementViews();
        } catch (viewError) {
            console.error('Error incrementing views:', viewError.message);
        }

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
        const jobData = {
            ...req.body,
            employer: req.user._id,
        };

        // 1. Move nested location.coordinates to root if they exist
        if (jobData.location && jobData.location.coordinates) {
            if (!jobData.coordinates) {
                jobData.coordinates = jobData.location.coordinates;
            }
            delete jobData.location.coordinates;
        }

        // 2. Sanitize coordinates
        if (jobData.coordinates) {
            const { type, coordinates } = jobData.coordinates;
            if (type !== 'Point' || !Array.isArray(coordinates) || coordinates.length !== 2 || 
                isNaN(parseFloat(coordinates[0])) || isNaN(parseFloat(coordinates[1]))) {
                delete jobData.coordinates;
            }
        }

        // Validate daily job fields
        if (jobData.jobType === 'DAILY') {
            if (!jobData.workDate || !jobData.startTime || !jobData.endTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Daily jobs require workDate, startTime, and endTime',
                });
            }
        }

        const job = await Job.create(jobData);

        // Update Employer Stats
        await User.findByIdAndUpdate(req.user._id, { $inc: { 'stats.totalJobsPosted': 1 } });

        // Broadcast to jobseekers
        try {
            await notifyJobseekers(job._id, job.title, job.company, job.category);
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
        fs.appendFileSync('error_debug.log', `[${new Date().toISOString()}] ❌ Create Job Error: ${error.stack}\n`);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
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
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid Job ID format' });
        }
        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        if (job.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this job',
            });
        }

        const allowedUpdates = [
            'title', 'description', 'company', 'salaryMin', 'salaryMax', 'salaryType',
            'location', 'workDate', 'startTime', 'endTime', 'workersRequired', 'skills',
            'experience', 'education', 'status', 'deadline', 'isUrgent', 'category',
            'foodProvided', 'shift', 'daysPerWeek', 'workingHours', 'joiningDate',
            'vacancyType', 'autoApprove', 'showContactInfo', 'contactPhone',
            'accommodation', 'immediateJoining', 'coordinates'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                if (field === 'coordinates' && req.body.coordinates) {
                    const { type, coordinates } = req.body.coordinates;
                    if (type === 'Point' && Array.isArray(coordinates) && coordinates.length === 2 && 
                        !isNaN(parseFloat(coordinates[0])) && !isNaN(parseFloat(coordinates[1]))) {
                        job.coordinates = req.body.coordinates;
                    }
                } else {
                    job[field] = req.body[field];
                }
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
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid Job ID format' });
        }
        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        if (job.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this job',
            });
        }

        await Application.deleteMany({ job: job._id });
        await job.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Job deleted successfully',
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

        if (status) query.status = status.toUpperCase();
        if (jobType) query.jobType = jobType.toUpperCase();

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
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid Job ID format' });
        }
        const job = await Job.findById(id);

        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        if (job.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        const stats = {
            views: job.views,
            totalApplications: await Application.countDocuments({ job: job._id }),
            acceptedApplications: await Application.countDocuments({ job: job._id, status: 'ACCEPTED' }),
            rejectedApplications: await Application.countDocuments({ job: job._id, status: 'REJECTED' }),
            pendingApplications: await Application.countDocuments({ job: job._id, status: { $in: ['APPLIED', 'UNDER_REVIEW'] } }),
            workersRequired: job.workersRequired,
            workersHired: job.workersHired,
        };

        res.status(200).json({
            success: true,
            stats,
        });
    } catch (error) {
        console.error('Get Job Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch stats',
            error: error.message,
        });
    }
};

// Haversine helper
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// @desc    Get nearby jobs
// @route   GET /api/jobs/nearby
exports.getNearbyJobs = async (req, res) => {
    try {
        const { lat, lng, distance = 10 } = req.query;
        if (!lat || !lng) return res.status(400).json({ success: false, message: 'Lat and Lng required' });

        const userLat = parseFloat(lat);
        const userLng = parseFloat(lng);
        const maxDistMetres = parseFloat(distance) * 1000;

        const geoJobs = await Job.aggregate([
            {
                $geoNear: {
                    near: { type: 'Point', coordinates: [userLng, userLat] },
                    distanceField: 'distanceMetres',
                    maxDistance: maxDistMetres,
                    spherical: true,
                    query: { status: 'ACTIVE' },
                },
            },
            { $sort: { distanceMetres: 1 } },
        ]);

        const populatedJobs = await Job.populate(geoJobs, {
            path: 'employer',
            select: 'name email phone company stats trustScore',
        });

        const results = populatedJobs.map((job) => ({
            ...job,
            distanceKm: parseFloat((job.distanceMetres / 1000).toFixed(2)),
        }));

        res.status(200).json({
            success: true,
            count: results.length,
            jobs: results,
        });
    } catch (error) {
        console.error('Nearby error:', error);
        res.status(500).json({ success: false, message: 'Nearby jobs failed', error: error.message });
    }
};

// @desc    Get public statistics (counts of jobs, employees/jobseekers, employers)
// @route   GET /api/jobs/public/stats
// @access  Public
exports.getPublicStats = async (req, res) => {
    try {
        const noOfJobs = await Job.countDocuments();
        const noOfEmployees = await User.countDocuments({ role: 'jobseeker' });
        const noOfEmployers = await User.countDocuments({ role: 'employer' });

        res.status(200).json({
            success: true,
            stats: {
                noOfJobs,
                noOfEmployees,
                noOfEmployers
            }
        });
    } catch (error) {
        console.error('Get Public Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch public statistics',
            error: error.message,
        });
    }
};
