import React, { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('unread'); // default to unread
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();

    // Fetch notifications
    const fetchNotifications = async (pageNum = 1, filterType = filter) => {
        setLoading(true);
        try {
            const params = { page: pageNum, limit: 15 };
            // Default to unread if filter is 'all' or 'unread' to hide read messages by default
            // But if user explicitly clicks 'read', show read ones.
            // Wait, the user request is "don't display the already read or clicked on message"
            // So default behavior should be equivalent to showing unread only.

            if (filterType === 'unread' || filterType === 'all') {
                params.read = false;
            } else if (filterType === 'read') {
                params.read = true;
            }

            const data = await notificationAPI.getNotifications(params);
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
            setTotalPages(data.pages);
            setPage(pageNum);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mark as read
    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    // Mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Delete notification
    const handleDelete = async (id) => {
        try {
            await notificationAPI.deleteNotification(id);
            setNotifications(notifications.filter(n => n._id !== id));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Clear all read
    const handleClearRead = async () => {
        if (window.confirm('Are you sure you want to clear all read notifications?')) {
            try {
                await notificationAPI.clearReadNotifications();
                setNotifications(notifications.filter(n => !n.read));
            } catch (error) {
                console.error('Error clearing read notifications:', error);
            }
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            handleMarkAsRead(notification._id);
        }
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    // Change filter
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        fetchNotifications(1, newFilter);
    };

    // Load more
    const handlePageChange = (newPage) => {
        fetchNotifications(newPage);
    };

    // Format time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        return date.toLocaleString();
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <div className="notifications-page">
            <div className="notifications-container">
                <div className="notifications-header">
                    <div>
                        <h1>Notifications</h1>
                        <p className="subtitle">{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="header-actions">
                        <button className="action-btn" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                            Mark All as Read
                        </button>
                        <button className="action-btn secondary" onClick={handleClearRead}>
                            Clear Read
                        </button>
                    </div>
                </div>

                <div className="notifications-filters">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('unread')}
                    >
                        Unread
                    </button>
                    <button
                        className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
                        onClick={() => handleFilterChange('read')}
                    >
                        Read
                    </button>
                </div>

                <div className="notifications-content">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="empty-state">
                            <span className="empty-icon">📭</span>
                            <h2>No Notifications</h2>
                            <p>You're all caught up! No notifications to show.</p>
                        </div>
                    ) : (
                        <>
                            <div className="notifications-list">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification._id}
                                        className={`notification-card ${!notification.read ? 'unread' : ''}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="notification-main">
                                            <div className="notification-icon">
                                                {notification.icon}
                                            </div>
                                            <div className="notification-details">
                                                <div className="notification-header-row">
                                                    <h3>{notification.title}</h3>
                                                    {!notification.read && <span className="unread-badge">NEW</span>}
                                                </div>
                                                <p className="notification-message">{notification.message}</p>
                                                <span className="notification-time">{formatTime(notification.createdAt)}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(notification._id);
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        className="page-btn"
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </button>
                                    <span className="page-info">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        className="page-btn"
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
