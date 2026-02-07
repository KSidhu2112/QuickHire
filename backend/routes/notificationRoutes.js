const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected (require authentication)
router.use(protect);

// Get notifications
router.get('/', getNotifications);

// Get unread count
router.get('/unread-count', getUnreadCount);

// Mark all as read
router.put('/mark-all-read', markAllAsRead);

// Clear read notifications
router.delete('/clear-read', clearReadNotifications);

// Mark single notification as read
router.put('/:id/read', markAsRead);

// Delete single notification
router.delete('/:id', deleteNotification);

module.exports = router;
