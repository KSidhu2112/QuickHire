const aiMatchingService = require('../services/aiMatchingService');
const Job = require('../models/Job');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * @desc    Get top recommended workers for a specific job post
 * @route   GET /api/ai/match-workers/:jobId
 * @access  Private (Employer)
 */
exports.getMatchedWorkers = async (req, res) => {
    try {
        const { jobId } = req.params;
        const limit = parseInt(req.query.limit) || 5;

        if (!mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid Job ID format'
            });
        }

        // Verify the job exists and belongs to this employer (if employer is logged in)
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({
                success: false,
                message: 'Job post not found'
            });
        }

        // Perform AI matching and ranking
        console.log(`🤖 AI Matching: Recommending workers for job "${job.title}"...`);
        const matchedWorkers = await aiMatchingService.matchWorkersForJob(jobId, { limit });

        res.status(200).json({
            success: true,
            job: {
                id: job._id,
                title: job.title,
                company: job.company,
                skillsRequired: job.skills
            },
            count: matchedWorkers.length,
            workers: matchedWorkers
        });
    } catch (error) {
        console.error('AI Matching Error (getMatchedWorkers):', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find matching workers',
            error: error.message
        });
    }
};

/**
 * @desc    Get top recommended job posts for the logged-in worker
 * @route   GET /api/ai/recommend-jobs
 * @access  Private (Worker/Jobseeker)
 */
exports.getRecommendedJobs = async (req, res) => {
    try {
        const workerId = req.user.id; // From auth middleware
        const limit = parseInt(req.query.limit) || 5;

        const worker = await User.findById(workerId);
        if (!worker) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        if (worker.role !== 'jobseeker') {
            return res.status(400).json({
                success: false,
                message: 'Only registered jobseekers can request recommended jobs'
            });
        }

        // Perform AI matching and ranking
        console.log(`🤖 AI Matching: Recommending jobs for worker "${worker.name}"...`);
        const recommendedJobs = await aiMatchingService.matchJobsForWorker(workerId, { limit });

        res.status(200).json({
            success: true,
            worker: {
                id: worker._id,
                name: worker.name,
                skills: worker.profile?.skills || []
            },
            count: recommendedJobs.length,
            jobs: recommendedJobs
        });
    } catch (error) {
        console.error('AI Matching Error (getRecommendedJobs):', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find recommended jobs',
            error: error.message
        });
    }
};

/**
 * @desc    On-demand force-refresh/generate embeddings for the logged-in user
 * @route   POST /api/ai/refresh-profile-embedding
 * @access  Private
 */
exports.refreshProfileEmbedding = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found'
            });
        }

        const embeddingService = require('../services/embeddingService');
        const text = user.role === 'jobseeker' 
            ? embeddingService.buildWorkerProfileText(user)
            : `User Name: ${user.name}. Role: ${user.role}. Company: ${user.profile?.company || ''}`;

        user.embedding = await embeddingService.generateEmbedding(text);
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile embedding successfully generated and synchronized!',
            embeddingLength: user.embedding.length
        });
    } catch (error) {
        console.error('AI Refresh Embedding Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sync profile embedding',
            error: error.message
        });
    }
};
