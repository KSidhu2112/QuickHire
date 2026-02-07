const Notification = require('../models/Notification');

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
    try {
        const { read, type, page = 1, limit = 20 } = req.query;
        const userId = req.user._id;

        const query = { recipient: userId };

        // Filter by read status
        if (read !== undefined) {
            query.read = read === 'true';
        }

        // Filter by type
        if (type) {
            query.type = type;
        }

        const skip = (page - 1) * limit;
        const notifications = await Notification.find(query)
            .populate('relatedJob', 'title company jobType')
            .populate('relatedUser', 'name email')
            .sort('-createdAt')
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.getUnreadCount(userId);

        res.status(200).json({
            success: true,
            count: notifications.length,
            total,
            unreadCount,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            notifications,
        });
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: error.message,
        });
    }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user._id;
        const unreadCount = await Notification.getUnreadCount(userId);

        res.status(200).json({
            success: true,
            unreadCount,
        });
    } catch (error) {
        console.error('Get Unread Count Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count',
            error: error.message,
        });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user._id;

        const notification = await Notification.findOne({
            _id: notificationId,
            recipient: userId,
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        await notification.markAsRead();

        res.status(200).json({
            success: true,
            message: 'Notification marked as read',
            notification,
        });
    } catch (error) {
        console.error('Mark As Read Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message,
        });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        const result = await Notification.markAllAsRead(userId);

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        console.error('Mark All As Read Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message,
        });
    }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user._id;

        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            recipient: userId,
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully',
        });
    } catch (error) {
        console.error('Delete Notification Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message,
        });
    }
};

// @desc    Delete all read notifications
// @route   DELETE /api/notifications/clear-read
// @access  Private
exports.clearReadNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const result = await Notification.deleteMany({
            recipient: userId,
            read: true,
        });

        res.status(200).json({
            success: true,
            message: 'Read notifications cleared successfully',
            deletedCount: result.deletedCount,
        });
    } catch (error) {
        console.error('Clear Read Notifications Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear read notifications',
            error: error.message,
        });
    }
};


