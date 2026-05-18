const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware');

// @desc    Upload file(s)
// @route   POST /api/upload
// @access  Private
router.post('/', protect, upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const filePath = `/uploads/${req.file.filename}`;

        res.status(200).json({
            success: true,
            filePath: filePath,
            fileName: req.file.originalname,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error('File Upload Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
