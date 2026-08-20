const express = require('express');
const router = express.Router();
const {
    createOrUpdateProfile,
    getMyProfile,
    getProfile,
    submitDetailedRating,
    getEmployeeRatings,
    recalculateTrustScore,
    uploadProfilePhoto,
} = require('../controllers/employeeProfileController');
const { protect } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Profile CRUD
router.post('/', protect, checkRole(['jobseeker', 'employee']), createOrUpdateProfile);
router.get('/me', protect, checkRole(['jobseeker', 'employee']), getMyProfile);
router.get('/:userId', getProfile);

// Photo upload
router.post('/upload-photo', protect, checkRole(['jobseeker', 'employee']), upload.single('photo'), uploadProfilePhoto);

// Employer ratings
router.post('/rate', protect, checkRole(['employer']), submitDetailedRating);
router.get('/ratings/:employeeId', getEmployeeRatings);

// Trust score
router.post('/recalculate-trust/:userId', protect, recalculateTrustScore);

module.exports = router;
