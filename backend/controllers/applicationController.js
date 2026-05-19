const Application = require('../models/Application');
const Job = require('../models/Job');
const Review = require('../models/Review');
const User = require('../models/User');
const Dispute = require('../models/Dispute');
const Transaction = require('../models/Transaction');
const {
    notifyNewApplication,
    notifyApplicationSubmitted,
    notifyShortlisted,
    notifyRejected
} = require('../services/notificationService');

// ... (existing imports and functions)

// @desc    Get hired employees (accepted applications)
// @route   GET /api/applications/employer/hired
// @access  Private (Employer only)
exports.getHiredEmployees = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const query = {
            employer: req.user._id,
            status: 'ACCEPTED',
        };

        const skip = (page - 1) * limit;

        const applications = await Application.find(query)
            .populate('job', 'title company jobType location salaryMin salaryMax')
            .populate('jobseeker', 'name email phone profile stats trustScore')
            .sort('-reviewedAt') // Most recently hired first
            .limit(parseInt(limit))
            .skip(skip)
            .lean(); // Use lean to modify the result

        const total = await Application.countDocuments(query);

        // Fetch reviews for these applications
        const employeesWithReviews = await Promise.all(applications.map(async (app) => {
            // Query actual Review documents — this is the ONLY source of truth
            const review = await Review.findOne({
                reviewer: req.user._id,
                reviewee: app.jobseeker._id,
                job: app.job._id
            });

            const otherPartyReview = await Review.findOne({
                reviewer: app.jobseeker._id,
                reviewee: req.user._id,
                job: app.job._id
            });

            const bothRated = !!(review && otherPartyReview);

            // Self-heal: sync flags to match actual review existence
            const correctEmployerRated = !!review;
            const correctEmployeeRated = !!otherPartyReview;
            const correctPublished = bothRated;

            if (app.employerRated !== correctEmployerRated ||
                app.employeeRated !== correctEmployeeRated ||
                app.ratingPublished !== correctPublished) {
                await Application.updateOne(
                    { _id: app._id },
                    {
                        employerRated: correctEmployerRated,
                        employeeRated: correctEmployeeRated,
                        ratingPublished: correctPublished
                    }
                );
            }
            app.employerRated = correctEmployerRated;
            app.employeeRated = correctEmployeeRated;
            app.ratingPublished = correctPublished;

            return {
                ...app,
                review: review || null,
                receivedReview: bothRated ? otherPartyReview : null
            };
        }));

        res.status(200).json({
            success: true,
            count: employeesWithReviews.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            employees: employeesWithReviews,
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

// @desc    Apply for a job
// @route   POST /api/applications/:jobId
// @access  Private (Job Seeker only)
exports.applyForJob = async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const jobseekerId = req.user._id;

        console.log('📝 Apply for Job - JobID:', jobId, 'JobSeeker:', req.user.email);

        // Check if job exists
        const job = await Job.findById(jobId);
        if (!job) {
            console.log('❌ Job not found:', jobId);
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        console.log('✅ Job found:', job.title);

        // Check if job is active
        if (job.status !== 'ACTIVE') {
            console.log('❌ Job not active, status:', job.status);
            return res.status(400).json({
                success: false,
                message: 'This job is no longer accepting applications',
            });
        }

        // Check if user already applied
        const existingApplication = await Application.findOne({
            job: jobId,
            jobseeker: jobseekerId,
        });

        if (existingApplication) {
            console.log('❌ User already applied');
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job',
            });
        }

        // For daily jobs, check if positions are full
        // Check if positions are full
        if (job.workersHired >= job.workersRequired) {
            console.log('❌ Job is full');
            return res.status(400).json({
                success: false,
                message: 'All positions for this job have been filled',
            });
        }

        console.log('✅ Creating application...');

        // Determine initial status based on auto-approval
        let initialStatus = 'APPLIED';
        let note = '';
        let reviewedAt = null;
        let reviewedBy = null;

        if (job.autoApprove) {
            initialStatus = 'ACCEPTED';
            note = 'Auto-approved application';
            reviewedAt = new Date();
            reviewedBy = job.employer;
        }

        // Create application
        const application = await Application.create({
            job: jobId,
            jobseeker: jobseekerId,
            employer: job.employer,
            coverLetter: req.body.coverLetter,
            resumeUrl: req.body.resumeUrl,
            availability: req.body.availability,
            status: initialStatus,
            employerNotes: note,
            reviewedAt: reviewedAt,
            reviewedBy: reviewedBy
        });

        // If auto-approved, increment workers hired immediately
        if (job.autoApprove) {
            await job.hireWorker();
            console.log('✅ Auto-approved: Worker hired');
        }

        console.log('✅ Application created:', application._id);

        // Increment job applicants count
        await job.incrementApplicants();

        console.log('✅ Applicants count incremented');

        // Populate application for response
        const populatedApplication = await application.populate([
                { path: 'job', select: 'title company jobType location salaryMin salaryMax' },
                { path: 'jobseeker', select: 'name email phone stats trustScore' }
            ]);

        console.log('✅ Application populated successfully');

        // Send notifications
        try {
            if (job.autoApprove) {
                // Notify jobseeker of acceptance
                await notifyShortlisted(
                    jobseekerId,
                    jobId,
                    application._id,
                    job.title,
                    job.company
                );
                // Notify employer of new hire
                // Using notifyNewApplication for now, but context implies hire
                await notifyNewApplication(
                    job.employer,
                    jobId,
                    application._id,
                    job.title,
                    req.user.name + ' (Auto-Joined)'
                );
            } else {
                // Notify employer of new application
                // Notify employer of new application
                await notifyNewApplication(
                    job.employer,
                    jobId,
                    application._id,
                    job.title,
                    req.user.name || 'A candidate'
                );

                // Notify jobseeker of successful application
                await notifyApplicationSubmitted(
                    jobseekerId,
                    jobId,
                    application._id,
                    job.title,
                    job.company
                );
            }

            console.log('✅ Notifications sent');
        } catch (notifError) {
            console.error('Notification Error (non-fatal):', notifError);
            // Don't fail the request if notifications fail
        }

        res.status(201).json({
            success: true,
            message: job.autoApprove
                ? 'You have successfully joined the job!'
                : 'Application submitted successfully!',
            application: populatedApplication,
        });
    } catch (error) {
        console.error('❌ Apply for Job Error:', error);
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);

        // Handle duplicate application error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this job',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to submit application',
            error: error.message,
        });
    }
};

// @desc    Get jobseeker's applications
// @route   GET /api/applications
// @access  Private (Job Seeker only)
exports.getUserApplications = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;

        const query = { jobseeker: req.user._id };

        if (status) {
            query.status = status.toUpperCase();
        }

        const skip = (page - 1) * limit;
        const applications = await Application.find(query)
            .populate('job', 'title company jobType location salaryMin salaryMax workDate status')
            .populate('employer', 'name email phone company stats trustScore')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Application.countDocuments(query);

        // Fetch reviews for these applications
        const applicationsWithReviews = await Promise.all(applications.map(async (app) => {
            const appObj = app.toObject ? app.toObject() : app;

            // Query actual Review documents — this is the ONLY source of truth
            const review = await Review.findOne({
                reviewer: req.user._id,
                reviewee: appObj.employer._id,
                job: appObj.job._id
            });

            const otherPartyReview = await Review.findOne({
                reviewer: appObj.employer._id,
                reviewee: req.user._id,
                job: appObj.job._id
            });

            const bothRated = !!(review && otherPartyReview);

            // Self-heal: sync flags to match actual review existence
            const correctEmployeeRated = !!review;
            const correctEmployerRated = !!otherPartyReview;
            const correctPublished = bothRated;

            if (appObj.employerRated !== correctEmployerRated ||
                appObj.employeeRated !== correctEmployeeRated ||
                appObj.ratingPublished !== correctPublished) {
                await Application.updateOne(
                    { _id: appObj._id },
                    {
                        employerRated: correctEmployerRated,
                        employeeRated: correctEmployeeRated,
                        ratingPublished: correctPublished
                    }
                );
            }
            appObj.employerRated = correctEmployerRated;
            appObj.employeeRated = correctEmployeeRated;
            appObj.ratingPublished = correctPublished;

            return {
                ...appObj,
                review: review || null,
                receivedReview: bothRated ? otherPartyReview : null
            };
        }));

        res.status(200).json({
            success: true,
            count: applicationsWithReviews.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            applications: applicationsWithReviews,
        });
    } catch (error) {
        console.error('Get User Applications Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your applications',
            error: error.message,
        });
    }
};

// @desc    Get applications for a specific job
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer - own jobs only)
exports.getJobApplications = async (req, res) => {
    try {
        const jobId = req.params.jobId;

        // Check if job exists and user is the employer
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job not found',
            });
        }

        if (job.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view these applications',
            });
        }

        const { status, page = 1, limit = 20 } = req.query;

        const query = { job: jobId };

        if (status) {
            query.status = status.toUpperCase();
        }

        const skip = (page - 1) * limit;
        const applications = await Application.find(query)
            .populate('jobseeker', 'name email phone profile stats trustScore')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Application.countDocuments(query);

        // Get count by status
        const statusCounts = await Application.aggregate([
            { $match: { job: job._id } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);

        res.status(200).json({
            success: true,
            count: applications.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            statusCounts,
            applications,
        });
    } catch (error) {
        console.error('Get Job Applications Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch job applications',
            error: error.message,
        });
    }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Employer only)
exports.updateApplicationStatus = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const { status, notes } = req.body;

        // Validate status
        const validStatuses = ['UNDER_REVIEW', 'ACCEPTED', 'REJECTED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be UNDER_REVIEW, ACCEPTED, or REJECTED',
            });
        }

        // Find application
        const application = await Application.findById(applicationId)
            .populate('job');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Check if user is the employer
        if (application.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this application',
            });
        }

        // Check if application was withdrawn
        if (application.status === 'WITHDRAWN') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update withdrawn application',
            });
        }

        // Update application
        application.status = status;
        application.employerNotes = notes || application.employerNotes;
        application.reviewedAt = new Date();
        application.reviewedBy = req.user._id;

        await application.save();

        // If accepted, increment workersHired
        if (status === 'ACCEPTED') {
            await application.job.hireWorker();
        }

        // Populate for response
        await application.populate('jobseeker', 'name email');

        // Send notifications to jobseeker
        try {
            if (status === 'ACCEPTED') {
                await notifyShortlisted(
                    application.jobseeker._id,
                    application.job._id,
                    application._id,
                    application.job.title,
                    application.job.company
                );
            } else if (status === 'REJECTED') {
                await notifyRejected(
                    application.jobseeker._id,
                    application.job._id,
                    application._id,
                    application.job.title
                );
            }
            console.log(`✅ Status update notification sent to jobseeker`);
        } catch (notifError) {
            console.error('Notification Error (non-fatal):', notifError);
        }

        res.status(200).json({
            success: true,
            message: `Application ${status.toLowerCase()} successfully`,
            application,
        });
    } catch (error) {
        console.error('Update Application Status Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update application status',
            error: error.message,
        });
    }
};

// @desc    Withdraw application
// @route   DELETE /api/applications/:id
// @access  Private (Job Seeker - own applications only)
exports.withdrawApplication = async (req, res) => {
    try {
        const applicationId = req.params.id;

        const application = await Application.findById(applicationId)
            .populate('job');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Check if user is the jobseeker
        if (application.jobseeker.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to withdraw this application',
            });
        }

        // Check if already accepted
        if (application.status === 'ACCEPTED') {
            return res.status(400).json({
                success: false,
                message: 'Cannot withdraw an accepted application. Please contact the employer.',
            });
        }

        // Withdraw application
        application.status = 'WITHDRAWN';
        await application.save();

        // Decrement job applicants count
        await application.job.decrementApplicants();

        res.status(200).json({
            success: true,
            message: 'Application withdrawn successfully',
        });
    } catch (error) {
        console.error('Withdraw Application Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to withdraw application',
            error: error.message,
        });
    }
};

// @desc    Get application by ID
// @route   GET /api/applications/:id
// @access  Private (Job Seeker or Employer - related to application)
exports.getApplicationById = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('job')
            .populate('jobseeker', 'name email phone profile stats trustScore')
            .populate('employer', 'name email company stats trustScore');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found',
            });
        }

        // Check authorization
        const isJobseeker = application.jobseeker._id.toString() === req.user._id.toString();
        const isEmployer = application.employer._id.toString() === req.user._id.toString();

        if (!isJobseeker && !isEmployer) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this application',
            });
        }

        res.status(200).json({
            success: true,
            application,
        });
    } catch (error) {
        console.error('Get Application Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch application',
            error: error.message,
        });
    }
};

// @desc    Get application statistics for jobseeker
// @route   GET /api/applications/stats
// @access  Private (Job Seeker only)
exports.getUserApplicationStats = async (req, res) => {
    try {
        const jobseekerId = req.user._id;

        const stats = await Application.aggregate([
            { $match: { jobseeker: jobseekerId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                },
            },
        ]);

        const total = await Application.countDocuments({ jobseeker: jobseekerId });

        res.status(200).json({
            success: true,
            total,
            stats,
        });
    } catch (error) {
        console.error('Get User Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch application statistics',
            error: error.message,
        });
    }
};



// @desc    Confirm work completion (Dual Confirmation)
// @route   POST /api/applications/:id/confirm
// @access  Private (Employer & Job Seeker)
exports.confirmWork = async (req, res) => {
    try {
        const applicationId = req.params.id;
        const { status, rating, feedback, proof } = req.body; // status: FULL/PARTIAL/NO_SHOW etc.

        const application = await Application.findById(applicationId).populate('job');
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const isEmployer = application.employer.toString() === req.user._id.toString();
        const isJobseeker = application.jobseeker.toString() === req.user._id.toString();

        if (!isEmployer && !isJobseeker) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Update Confirmation Status
        const timestamp = Date.now();
        if (isEmployer) {
            application.employerConfirmation = { confirmed: true, status, rating, feedback, proof, timestamp };
        } else {
            application.employeeConfirmation = { confirmed: true, status, rating, feedback, proof, timestamp };
        }

        // Check for Dual Confirmation & Resolution
        if (application.employerConfirmation.confirmed && application.employeeConfirmation.confirmed) {
            const empStatus = application.employerConfirmation.status; // FULL, PARTIAL, NO_SHOW
            const seekerStatus = application.employeeConfirmation.status; // FULL_PAYMENT, PARTIAL_PAYMENT, NOT_PAID

            // Case 1: Success - Both Agree on Full Completion
            if (empStatus === 'FULL' && seekerStatus === 'FULL_PAYMENT') {
                application.workStatus = 'COMPLETED';
                application.paymentStatus = 'RELEASED';

                // TODO: Trigger Wallet Transfer Here
                // User.findById(application.employer).then(u => { u.walletBalance -= amount; u.save(); })
                // User.findById(application.jobseeker).then(u => { u.walletBalance += amount; u.save(); })

            }
            // Case 2: Dispute - Conflict
            else {
                application.workStatus = 'DISPUTED';
                application.paymentStatus = 'DISPUTED';

                // Auto-create dispute
                const dispute = await Dispute.create({
                    job: application.job._id,
                    application: application._id,
                    raisedBy: req.user._id, // Whoever triggered the final confirmation
                    against: isEmployer ? application.jobseeker : application.employer,
                    reason: 'OTHER',
                    description: `Auto-generated dispute. Employer: ${empStatus}, Employee: ${seekerStatus}`,
                    status: 'OPEN'
                });
                application.dispute = dispute._id;
            }
        }

        await application.save();

        res.status(200).json({
            success: true,
            message: 'Confirmation submitted',
            application
        });

    } catch (error) {
        console.error('Confirm Work Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Mark application as paid by employer
// @route   POST /api/applications/:id/mark-paid
// @access  Private (Employer only)
exports.markAsPaid = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        if (application.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        application.isPaid = true;
        application.payment_status = 'Paid';
        await application.save();
        res.status(200).json({ success: true, message: 'Marked as paid successfully', application });
    } catch (error) {
        console.error('Mark As Paid Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Confirm payment received by employee
// @route   POST /api/applications/:id/confirm-payment
// @access  Private (Jobseeker only)
exports.confirmPaymentReceived = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }
        if (application.jobseeker.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        application.paymentReceived = true;
        application.payment_status = 'Received';
        await application.save();
        res.status(200).json({ success: true, message: 'Payment confirmed received successfully', application });
    } catch (error) {
        console.error('Confirm Payment Received Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Direct hire a matched worker
// @route   POST /api/applications/direct-hire
// @access  Private (Employer only)
exports.directHireWorker = async (req, res) => {
    try {
        const { jobId, workerId } = req.body;

        if (!jobId || !workerId) {
            return res.status(400).json({
                success: false,
                message: 'Job ID and Worker ID are required'
            });
        }

        // Verify the job exists and is owned by the employer
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job post not found'
            });
        }

        if (job.employer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to hire for this job'
            });
        }

        // Check if positions are full
        if (job.workersHired >= job.workersRequired) {
            return res.status(400).json({
                success: false,
                message: 'All positions for this job have already been filled!'
            });
        }

        // Verify worker exists and is a jobseeker
        const worker = await User.findById(workerId);
        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'Candidate worker not found'
            });
        }

        if (worker.role !== 'jobseeker') {
            return res.status(400).json({
                success: false,
                message: 'Target user is not a registered worker'
            });
        }

        // Check if there is an existing application
        let application = await Application.findOne({ job: jobId, jobseeker: workerId });

        if (application) {
            if (application.status === 'ACCEPTED') {
                return res.status(400).json({
                    success: false,
                    message: 'This worker has already been hired for this job!'
                });
            }
            application.status = 'ACCEPTED';
            application.employerNotes = 'Hired directly from AI recommendation matches';
            application.reviewedAt = new Date();
            application.reviewedBy = req.user._id;
            await application.save();
        } else {
            application = await Application.create({
                job: jobId,
                jobseeker: workerId,
                employer: job.employer,
                coverLetter: 'Hired directly from AI Matching Recommendations',
                status: 'ACCEPTED',
                employerNotes: 'Directly hired by employer from AI recommendation matches',
                reviewedAt: new Date(),
                reviewedBy: req.user._id
            });
            await job.incrementApplicants();
        }

        // Increment workers hired
        await job.hireWorker();

        // Send notification to hired employee
        try {
            await notifyShortlisted(
                workerId,
                jobId,
                application._id,
                job.title,
                job.company
            );
            console.log(`✅ Direct hire notification sent successfully to employee: ${worker.name}`);
        } catch (notifError) {
            console.error('Notification Error (non-fatal):', notifError);
        }

        res.status(200).json({
            success: true,
            message: `Successfully hired ${worker.name} and sent direct notification!`,
            application
        });
    } catch (error) {
        console.error('Direct Hire Worker Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete direct hire',
            error: error.message
        });
    }
};

