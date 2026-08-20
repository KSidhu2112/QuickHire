const express = require('express');
const router = express.Router();
const {
    submitContactMessage,
    getPlatformStats,
    getAllContactMessages,
    updateMessageStatus,
    deleteContactMessage,
    getContactMessageById
} = require('../controllers/contactController');
const { protect, checkRole } = require('../middleware/authMiddleware');

// Public routes
router.post('/', submitContactMessage);
router.get('/stats', getPlatformStats);

// Admin routes
router.get('/admin/messages', protect, checkRole(['admin']), getAllContactMessages);
router.get('/admin/messages/:id', protect, checkRole(['admin']), getContactMessageById);
router.patch('/admin/messages/:id/status', protect, checkRole(['admin']), updateMessageStatus);
router.delete('/admin/messages/:id', protect, checkRole(['admin']), deleteContactMessage);

module.exports = router;
