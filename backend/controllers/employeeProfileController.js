const mongoose = require('mongoose');
const EmployeeProfile = require('../models/EmployeeProfile');
const EmployerRating = require('../models/EmployerRating');
const User = require('../models/User');
const Application = require('../models/Application');
const QuickhireRagData = require('../models/QuickhireRagData');

/**
 * @desc    Create or Update Employee Profile
 * @route   POST /api/employee-profile
 * @access  Private (Jobseeker only)
 */
exports.createOrUpdateProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const {
            profilePhoto,
            currentLocation,
            languages,
            preferredCategories,
            preferredWorkType,
            expectedSalary,
            preferredShift,
            immediateJoining,
            skills,
            yearsOfExperience,
            previousWorkExperience,
            certifications,
            vehicleOwnership,
        } = req.body;

        let profile = await EmployeeProfile.findOne({ user: userId });

        if (profile) {
            // Update existing profile
            if (profilePhoto !== undefined) profile.profilePhoto = profilePhoto;
            if (currentLocation) profile.currentLocation = { ...profile.currentLocation.toObject?.() || profile.currentLocation, ...currentLocation };
            if (languages) profile.languages = languages;
            if (preferredCategories) profile.preferredCategories = preferredCategories;
            if (preferredWorkType) profile.preferredWorkType = preferredWorkType;
            if (expectedSalary) profile.expectedSalary = { ...profile.expectedSalary.toObject?.() || profile.expectedSalary, ...expectedSalary };
            if (preferredShift !== undefined) profile.preferredShift = preferredShift;
            if (immediateJoining !== undefined) profile.immediateJoining = immediateJoining;
            if (skills) profile.skills = skills;
            if (yearsOfExperience !== undefined) profile.yearsOfExperience = yearsOfExperience;
            if (previousWorkExperience) profile.previousWorkExperience = previousWorkExperience;
            if (certifications) profile.certifications = certifications;
            if (vehicleOwnership !== undefined) profile.vehicleOwnership = vehicleOwnership;
        } else {
            // Create new profile
            profile = new EmployeeProfile({
                user: userId,
                profilePhoto: profilePhoto || '',
                currentLocation: currentLocation || {},
                languages: languages || [],
                preferredCategories: preferredCategories || [],
                preferredWorkType: preferredWorkType || [],
                expectedSalary: expectedSalary || {},
                preferredShift: preferredShift || '',
                immediateJoining: immediateJoining || false,
                skills: skills || [],
                yearsOfExperience: yearsOfExperience || 0,
                previousWorkExperience: previousWorkExperience || [],
                certifications: certifications || [],
                vehicleOwnership: vehicleOwnership || false,
            });
        }

        // Calculate completeness
        profile.calculateCompleteness();

        // Calculate trust score
        await profile.calculateTrustScore();

        // Generate candidate summary
        await profile.generateSummary();

        await profile.save();

        // Mark user profile as complete
        await User.findByIdAndUpdate(userId, {
            isProfileComplete: profile.isProfileComplete,
            'profile.skills': profile.skills,
            'profile.experience': `${profile.yearsOfExperience} years`,
            'profile.preferredJobRole': profile.preferredCategories.length > 0 ? profile.preferredCategories[0] : '',
            'profile.expectedSalary': profile.expectedSalary?.min ? `₹${profile.expectedSalary.min} - ₹${profile.expectedSalary.max}` : '',
            'profile.availableForWork': profile.immediateJoining,
        });

        // Sync to RAG vector database
        await syncProfileToRAG(profile, userId);

        res.status(200).json({
            success: true,
            message: profile.isProfileComplete ? 'Profile updated successfully!' : 'Profile saved. Please complete more fields for better matches.',
            profile,
            profileCompleteness: profile.profileCompleteness,
            isProfileComplete: profile.isProfileComplete,
        });
    } catch (error) {
        console.error('Create/Update Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save profile',
            error: error.message,
        });
    }
};

/**
 * @desc    Get current user's profile
 * @route   GET /api/employee-profile/me
 * @access  Private
 */
exports.getMyProfile = async (req, res) => {
    try {
        const profile = await EmployeeProfile.findOne({ user: req.user._id }).populate('user', 'name email phone stats trustScore badges createdAt isProfileComplete');

        if (!profile) {
            return res.status(200).json({
                success: true,
                profile: null,
                message: 'No profile found. Please complete your profile.',
            });
        }

        res.status(200).json({
            success: true,
            profile,
        });
    } catch (error) {
        console.error('Get My Profile Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message,
        });
    }
};

/**
 * @desc    Get employee profile by user ID (public, sanitized)
 * @route   GET /api/employee-profile/:userId
 * @access  Public
 */
exports.getProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const profile = await EmployeeProfile.findOne({ user: userId })
            .populate('user', 'name stats trustScore badges createdAt');

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        // Sanitize response - no private data
        const sanitizedProfile = {
            profilePhoto: profile.profilePhoto,
            currentLocation: { city: profile.currentLocation?.city, state: profile.currentLocation?.state },
            languages: profile.languages,
            preferredCategories: profile.preferredCategories,
            preferredWorkType: profile.preferredWorkType,
            preferredShift: profile.preferredShift,
            immediateJoining: profile.immediateJoining,
            skills: profile.skills,
            yearsOfExperience: profile.yearsOfExperience,
            certifications: profile.certifications,
            vehicleOwnership: profile.vehicleOwnership,
            profileCompleteness: profile.profileCompleteness,
            trustScore: profile.trustScore,
            overallRating: profile.overallRating,
            totalRatingsCount: profile.totalRatingsCount,
            ratings: profile.ratings,
            user: profile.user,
        };

        res.status(200).json({
            success: true,
            profile: sanitizedProfile,
        });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
    }
};

/**
 * @desc    Submit detailed employer rating for employee
 * @route   POST /api/employee-profile/rate
 * @access  Private (Employer only)
 */
exports.submitDetailedRating = async (req, res) => {
    try {
        const { employeeId, jobId, workQuality, punctuality, reliability, behavior, communication, feedback, wouldRehire } = req.body;
        const employerId = req.user._id;

        // Validate
        if (!employeeId || !jobId) {
            return res.status(400).json({ success: false, message: 'Employee ID and Job ID are required' });
        }

        if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(jobId)) {
            return res.status(400).json({ success: false, message: 'Invalid ID format' });
        }

        const ratings = [workQuality, punctuality, reliability, behavior, communication];
        for (const r of ratings) {
            if (!r || r < 1 || r > 5) {
                return res.status(400).json({ success: false, message: 'All rating fields must be between 1 and 5' });
            }
        }

        // Check if application exists and is ACCEPTED
        const application = await Application.findOne({
            job: jobId,
            jobseeker: employeeId,
            employer: employerId,
        });

        if (!application) {
            return res.status(400).json({ success: false, message: 'No engagement found between you and this worker for this job' });
        }

        if (application.status !== 'ACCEPTED') {
            return res.status(400).json({ success: false, message: 'Can only rate after hiring (status must be ACCEPTED)' });
        }

        // Check for duplicate
        const existing = await EmployerRating.findOne({ employer: employerId, employee: employeeId, job: jobId });
        if (existing) {
            return res.status(400).json({ success: false, message: 'You have already rated this worker for this job' });
        }

        // Create rating
        const rating = await EmployerRating.create({
            employer: employerId,
            employee: employeeId,
            job: jobId,
            workQuality,
            punctuality,
            reliability,
            behavior,
            communication,
            feedback: feedback || '',
            wouldRehire: wouldRehire || false,
        });

        // Update employee profile aggregated ratings
        let profile = await EmployeeProfile.findOne({ user: employeeId });
        if (profile) {
            profile.ratings.workQuality.total += workQuality;
            profile.ratings.workQuality.count += 1;
            profile.ratings.punctuality.total += punctuality;
            profile.ratings.punctuality.count += 1;
            profile.ratings.reliability.total += reliability;
            profile.ratings.reliability.count += 1;
            profile.ratings.behavior.total += behavior;
            profile.ratings.behavior.count += 1;
            profile.ratings.communication.total += communication;
            profile.ratings.communication.count += 1;
            profile.totalRatingsCount += 1;

            // Calculate overall rating
            const totalAll = profile.ratings.workQuality.total + profile.ratings.punctuality.total +
                profile.ratings.reliability.total + profile.ratings.behavior.total + profile.ratings.communication.total;
            const countAll = profile.ratings.workQuality.count + profile.ratings.punctuality.count +
                profile.ratings.reliability.count + profile.ratings.behavior.count + profile.ratings.communication.count;
            profile.overallRating = parseFloat((totalAll / countAll).toFixed(1));

            // Update rehire count
            if (wouldRehire) {
                profile.rehireCount += 1;
            }

            // Recalculate trust score
            await profile.calculateTrustScore();

            // Regenerate summary
            await profile.generateSummary();

            await profile.save();

            // Sync updated profile to RAG
            await syncProfileToRAG(profile, employeeId);

            // Update user stats
            await User.findByIdAndUpdate(employeeId, {
                'stats.avgRating': profile.overallRating,
                'stats.ratingCount': profile.totalRatingsCount,
                trustScore: profile.trustScore,
            });
        }

        res.status(201).json({
            success: true,
            message: 'Rating submitted successfully!',
            rating,
        });
    } catch (error) {
        console.error('Submit Detailed Rating Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'You have already rated this worker for this job' });
        }
        res.status(500).json({ success: false, message: 'Failed to submit rating', error: error.message });
    }
};

/**
 * @desc    Get ratings for an employee
 * @route   GET /api/employee-profile/ratings/:employeeId
 * @access  Public
 */
exports.getEmployeeRatings = async (req, res) => {
    try {
        const { employeeId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(employeeId)) {
            return res.status(400).json({ success: false, message: 'Invalid employee ID' });
        }

        const ratings = await EmployerRating.find({ employee: employeeId })
            .populate('employer', 'name profile.company')
            .populate('job', 'title company')
            .sort({ createdAt: -1 });

        const profile = await EmployeeProfile.findOne({ user: employeeId });

        res.status(200).json({
            success: true,
            count: ratings.length,
            ratings,
            summary: profile ? {
                overallRating: profile.overallRating,
                totalRatingsCount: profile.totalRatingsCount,
                trustScore: profile.trustScore,
                ratings: {
                    workQuality: profile.ratings.workQuality.count > 0 ? (profile.ratings.workQuality.total / profile.ratings.workQuality.count).toFixed(1) : 0,
                    punctuality: profile.ratings.punctuality.count > 0 ? (profile.ratings.punctuality.total / profile.ratings.punctuality.count).toFixed(1) : 0,
                    reliability: profile.ratings.reliability.count > 0 ? (profile.ratings.reliability.total / profile.ratings.reliability.count).toFixed(1) : 0,
                    behavior: profile.ratings.behavior.count > 0 ? (profile.ratings.behavior.total / profile.ratings.behavior.count).toFixed(1) : 0,
                    communication: profile.ratings.communication.count > 0 ? (profile.ratings.communication.total / profile.ratings.communication.count).toFixed(1) : 0,
                },
            } : null,
        });
    } catch (error) {
        console.error('Get Employee Ratings Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch ratings', error: error.message });
    }
};

/**
 * @desc    Recalculate trust score for an employee
 * @route   POST /api/employee-profile/recalculate-trust/:userId
 * @access  Private
 */
exports.recalculateTrustScore = async (req, res) => {
    try {
        const { userId } = req.params;

        const profile = await EmployeeProfile.findOne({ user: userId });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        const trustScore = await profile.calculateTrustScore();
        await profile.generateSummary();
        await profile.save();

        // Sync to RAG
        await syncProfileToRAG(profile, userId);

        res.status(200).json({
            success: true,
            trustScore,
            message: 'Trust score recalculated',
        });
    } catch (error) {
        console.error('Recalculate Trust Score Error:', error);
        res.status(500).json({ success: false, message: 'Failed to recalculate', error: error.message });
    }
};

/**
 * @desc    Upload profile photo
 * @route   POST /api/employee-profile/upload-photo
 * @access  Private
 */
exports.uploadProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filePath = `/uploads/${req.file.filename}`;

        // Update profile
        let profile = await EmployeeProfile.findOne({ user: req.user._id });
        if (profile) {
            profile.profilePhoto = filePath;
            profile.calculateCompleteness();
            await profile.save();
        }

        // Also update user avatar
        await User.findByIdAndUpdate(req.user._id, { 'profile.avatar': filePath });

        res.status(200).json({
            success: true,
            filePath,
            message: 'Photo uploaded successfully',
        });
    } catch (error) {
        console.error('Upload Photo Error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload photo', error: error.message });
    }
};

// ---- Helper: Sync profile to RAG vector database ----
async function syncProfileToRAG(profile, userId) {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        await QuickhireRagData.findOneAndUpdate(
            { candidateId: userId.toString() },
            {
                candidateId: userId.toString(),
                name: user.name,
                // DO NOT store email/phone in RAG for privacy
                skills: profile.skills,
                education: profile.certifications.join(', '),
                experience: `${profile.yearsOfExperience} years`,
                location: profile.currentLocation?.city || '',
                preferredRole: profile.preferredCategories.length > 0 ? profile.preferredCategories[0] : '',
                candidateSummary: profile.candidateSummary,
            },
            { upsert: true, new: true }
        );
    } catch (err) {
        console.error('RAG Sync Error:', err.message);
    }
}
