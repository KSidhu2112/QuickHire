import React, { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import './NotificationBell.css';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Fetch unread count
    const fetchUnreadCount = async () => {
        const token = localStorage.getItem('quickhire_token');
        if (!token) return;

        try {
            const data = await notificationAPI.getUnreadCount();
            setUnreadCount(data.unreadCount);
        } catch (error) {
            // Only log if it's not a 401 (handled by interceptor)
            if (error.response?.status !== 401) {
                console.error('Error fetching unread count:', error);
            }
        }
    };

    // Fetch recent notifications (only latest 5)
    const fetchNotifications = async () => {
        const token = localStorage.getItem('quickhire_token');
        if (!token) return;

        setLoading(true);
        try {
            const data = await notificationAPI.getNotifications({ page: 1, limit: 5, read: false });
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
            setTotalCount(data.total); // Total count of all notifications
        } catch (error) {
            if (error.response?.status !== 401) {
                console.error('Error fetching notifications:', error);
            }
        } finally {
            setLoading(false);
        }
    };

    // Mark notification as read
    const handleMarkAsRead = async (id) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Handle notification click
    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            handleMarkAsRead(notification._id);
        }
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
            setIsOpen(false);
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

    // Toggle dropdown
    const toggleDropdown = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    // Fetch unread count on mount and periodically
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Format time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="notification-bell" ref={dropdownRef}>
            <button className="bell-button" onClick={toggleDropdown}>
                <span className="bell-icon">🔔</span>
                {unreadCount > 0 && (
                    <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <div>
                            <h3>Recent Notifications</h3>
                            {totalCount > 5 && (
                                <p className="notification-hint">Showing latest 5 of {totalCount}</p>
                            )}
                        </div>
                        {unreadCount > 0 && (
                            <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="notification-list">
                        {loading ? (
                            <div className="loading">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">📭</span>
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-icon">{notification.icon}</div>
                                    <div className="notification-content">
                                        <div className="notification-title">{notification.title}</div>
                                        <div className="notification-message">{notification.message}</div>
                                        <div className="notification-time">{formatTime(notification.createdAt)}</div>
                                    </div>
                                    {!notification.read && <div className="unread-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="dropdown-footer">
                        <button
                            className="view-all-btn"
                            onClick={() => {
                                navigate('/notifications');
                                setIsOpen(false);
                            }}
                        >
                            {totalCount > 5
                                ? `View All ${totalCount} Notifications →`
                                : 'View All Notifications →'
                            }
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
