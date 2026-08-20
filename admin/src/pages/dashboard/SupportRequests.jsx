import React, { useState, useEffect } from 'react';
import {
    FaTicketAlt, FaSearch, FaFilter, FaTrash, FaEye,
    FaCheckCircle, FaClock, FaSpinner, FaTimes, FaEnvelope,
    FaPhone, FaUser, FaCalendarAlt, FaExclamationCircle
} from 'react-icons/fa';
import axios from 'axios';
import toast from 'react-hot-toast';
import './SupportRequests.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SupportRequests = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const getToken = () => localStorage.getItem('adminToken');

    useEffect(() => {
        fetchMessages();
    }, [page, statusFilter, search]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', 15);
            if (statusFilter !== 'All') params.append('status', statusFilter);
            if (search) params.append('search', search);

            const res = await axios.get(
                `${API_URL}/contact/admin/messages?${params.toString()}`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );

            if (res.data.success) {
                setMessages(res.data.messages);
                setTotalPages(res.data.totalPages);
                setTotal(res.data.total);
            }
        } catch (err) {
            console.error('Fetch messages error:', err);
            toast.error('Failed to fetch support messages');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await axios.patch(
                `${API_URL}/contact/admin/messages/${id}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            if (res.data.success) {
                toast.success(`Status updated to ${newStatus}`);
                setMessages(prev => prev.map(m =>
                    m._id === id ? { ...m, status: newStatus } : m
                ));
                if (selectedMessage?._id === id) {
                    setSelectedMessage(prev => ({ ...prev, status: newStatus }));
                }
            }
        } catch (err) {
            toast.error('Failed to update status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        try {
            const res = await axios.delete(
                `${API_URL}/contact/admin/messages/${id}`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            if (res.data.success) {
                toast.success('Message deleted');
                setMessages(prev => prev.filter(m => m._id !== id));
                setTotal(prev => prev - 1);
                if (selectedMessage?._id === id) {
                    setShowModal(false);
                    setSelectedMessage(null);
                }
            }
        } catch (err) {
            toast.error('Failed to delete message');
        }
    };

    const viewDetails = async (id) => {
        try {
            const res = await axios.get(
                `${API_URL}/contact/admin/messages/${id}`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            if (res.data.success) {
                setSelectedMessage(res.data.data);
                setShowModal(true);
            }
        } catch (err) {
            toast.error('Failed to fetch message details');
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            'Pending': { className: 'status-pending', icon: <FaClock /> },
            'In Progress': { className: 'status-progress', icon: <FaSpinner /> },
            'Resolved': { className: 'status-resolved', icon: <FaCheckCircle /> }
        };
        const c = config[status] || config['Pending'];
        return (
            <span className={`status-badge ${c.className}`}>
                {c.icon} {status}
            </span>
        );
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="support-requests-page">
            {/* Header */}
            <div className="sr-header">
                <div className="sr-header-left">
                    <h1><FaTicketAlt /> Support Requests</h1>
                    <span className="sr-total-badge">{total} total</span>
                </div>
            </div>

            {/* Filters */}
            <div className="sr-filters">
                <div className="sr-search-wrap">
                    <FaSearch className="sr-search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name, email, ticket ID..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
                <div className="sr-filter-btns">
                    {['All', 'Pending', 'In Progress', 'Resolved'].map(status => (
                        <button
                            key={status}
                            className={`sr-filter-btn ${statusFilter === status ? 'active' : ''}`}
                            onClick={() => { setStatusFilter(status); setPage(1); }}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="sr-table-wrapper">
                {loading ? (
                    <div className="sr-loading">
                        <FaSpinner className="spin" />
                        <p>Loading messages...</p>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="sr-empty">
                        <FaExclamationCircle />
                        <p>No support requests found</p>
                    </div>
                ) : (
                    <table className="sr-table">
                        <thead>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Subject</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.map((msg) => (
                                <tr key={msg._id}>
                                    <td className="ticket-id-cell">{msg.ticketId}</td>
                                    <td>{msg.fullName}</td>
                                    <td className="email-cell">{msg.email}</td>
                                    <td className="subject-cell">{msg.subject}</td>
                                    <td>{getStatusBadge(msg.status)}</td>
                                    <td className="date-cell">{formatDate(msg.createdAt)}</td>
                                    <td>
                                        <div className="sr-actions">
                                            <button
                                                className="action-btn view-btn"
                                                title="View Details"
                                                onClick={() => viewDetails(msg._id)}
                                            >
                                                <FaEye />
                                            </button>
                                            {msg.status !== 'Resolved' && (
                                                <button
                                                    className="action-btn resolve-btn"
                                                    title="Mark Resolved"
                                                    onClick={() => handleStatusChange(msg._id, 'Resolved')}
                                                >
                                                    <FaCheckCircle />
                                                </button>
                                            )}
                                            {msg.status === 'Resolved' && (
                                                <button
                                                    className="action-btn pending-btn"
                                                    title="Mark Pending"
                                                    onClick={() => handleStatusChange(msg._id, 'Pending')}
                                                >
                                                    <FaClock />
                                                </button>
                                            )}
                                            <button
                                                className="action-btn delete-btn"
                                                title="Delete"
                                                onClick={() => handleDelete(msg._id)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="sr-pagination">
                    <button
                        disabled={page <= 1}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Previous
                    </button>
                    <span>Page {page} of {totalPages}</span>
                    <button
                        disabled={page >= totalPages}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            {showModal && selectedMessage && (
                <div className="sr-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="sr-modal" onClick={e => e.stopPropagation()}>
                        <div className="sr-modal-header">
                            <h2><FaTicketAlt /> Ticket Details</h2>
                            <button className="sr-modal-close" onClick={() => setShowModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="sr-modal-body">
                            <div className="sr-detail-row">
                                <div className="sr-detail-item">
                                    <span className="sr-detail-label"><FaTicketAlt /> Ticket ID</span>
                                    <span className="sr-detail-value ticket-value">{selectedMessage.ticketId}</span>
                                </div>
                                <div className="sr-detail-item">
                                    <span className="sr-detail-label"><FaCalendarAlt /> Date</span>
                                    <span className="sr-detail-value">{formatDate(selectedMessage.createdAt)}</span>
                                </div>
                            </div>
                            <div className="sr-detail-row">
                                <div className="sr-detail-item">
                                    <span className="sr-detail-label"><FaUser /> Full Name</span>
                                    <span className="sr-detail-value">{selectedMessage.fullName}</span>
                                </div>
                                <div className="sr-detail-item">
                                    <span className="sr-detail-label"><FaEnvelope /> Email</span>
                                    <span className="sr-detail-value">{selectedMessage.email}</span>
                                </div>
                            </div>
                            {selectedMessage.phone && (
                                <div className="sr-detail-row">
                                    <div className="sr-detail-item">
                                        <span className="sr-detail-label"><FaPhone /> Phone</span>
                                        <span className="sr-detail-value">{selectedMessage.phone}</span>
                                    </div>
                                </div>
                            )}
                            <div className="sr-detail-single">
                                <span className="sr-detail-label">Subject</span>
                                <span className="sr-detail-value">{selectedMessage.subject}</span>
                            </div>
                            <div className="sr-detail-single">
                                <span className="sr-detail-label">Message</span>
                                <p className="sr-message-content">{selectedMessage.message}</p>
                            </div>
                            <div className="sr-detail-single">
                                <span className="sr-detail-label">Status</span>
                                <div className="sr-status-actions">
                                    {getStatusBadge(selectedMessage.status)}
                                    <div className="sr-status-btns">
                                        <button
                                            className="sr-status-btn pending"
                                            onClick={() => handleStatusChange(selectedMessage._id, 'Pending')}
                                        >
                                            Pending
                                        </button>
                                        <button
                                            className="sr-status-btn progress"
                                            onClick={() => handleStatusChange(selectedMessage._id, 'In Progress')}
                                        >
                                            In Progress
                                        </button>
                                        <button
                                            className="sr-status-btn resolved"
                                            onClick={() => handleStatusChange(selectedMessage._id, 'Resolved')}
                                        >
                                            Resolved
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="sr-modal-footer">
                            <button className="sr-delete-btn" onClick={() => handleDelete(selectedMessage._id)}>
                                <FaTrash /> Delete Message
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportRequests;
