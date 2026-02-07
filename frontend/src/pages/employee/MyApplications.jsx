import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './MyApplications.css';

const MyApplications = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        accepted: 0,
        pending: 0,
        rejected: 0
    });

    useEffect(() => {
        fetchApplications();
        fetchStats();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const response = await applicationAPI.getUserApplications({ limit: 50 });
            setApplications(response.applications || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
            toast.error('Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await applicationAPI.getUserStats();
            if (response.success && response.stats) {
                const newStats = {
                    total: response.total,
                    accepted: 0,
                    pending: 0,
                    rejected: 0
                };

                response.stats.forEach(item => {
                    if (item._id === 'ACCEPTED') newStats.accepted = item.count;
                    else if (item._id === 'REJECTED') newStats.rejected = item.count;
                    else newStats.pending += item.count;
                });

                setStats(newStats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACCEPTED': return 'success';
            case 'REJECTED': return 'error';
            case 'WITHDRAWN': return 'gray';
            default: return 'warning';
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="my-applications-page">
            <div className="page-header">
                <button className="back-button" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
                <h1>My Applications</h1>
                <p>Track the status of your job applications</p>
            </div>

            {/* Stats Overview */}
            <div className="stats-grid">
                <div className="stat-card total">
                    <span className="stat-value">{stats.total}</span>
                    <span className="stat-label">Total Applied</span>
                </div>
                <div className="stat-card success">
                    <span className="stat-value">{stats.accepted}</span>
                    <span className="stat-label">Accepted</span>
                </div>
                <div className="stat-card warning">
                    <span className="stat-value">{stats.pending}</span>
                    <span className="stat-label">Pending</span>
                </div>
                <div className="stat-card error">
                    <span className="stat-value">{stats.rejected}</span>
                    <span className="stat-label">Rejected</span>
                </div>
            </div>

            {/* Applications List */}
            <div className="applications-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="loader"></div>
                        <p>Loading applications...</p>
                    </div>
                ) : applications.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📂</div>
                        <h3>No applications yet</h3>
                        <p>Start applying to jobs from your dashboard!</p>
                        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
                            Browse Jobs
                        </button>
                    </div>
                ) : (
                    <div className="applications-list">
                        {applications.map((app) => (
                            <div key={app._id} className="application-card">
                                <div className="app-header">
                                    <div className="app-job-info">
                                        <h3>{app.job?.title || 'Unknown Job'}</h3>
                                        <p className="company">{app.job?.company}</p>
                                    </div>
                                    <div className={`status-badge ${getStatusColor(app.status)}`}>
                                        {app.status}
                                    </div>
                                </div>

                                <div className="app-details">
                                    <div className="detail-row">
                                        <span className="label">Applied On:</span>
                                        <span className="value">{formatDate(app.createdAt)}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Salary:</span>
                                        <span className="value">
                                            ₹{app.job?.salaryMin} - ₹{app.job?.salaryMax} ({app.job?.salaryType})
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">Job Type:</span>
                                        <span className="value">{app.job?.jobType?.replace('_', ' ')}</span>
                                    </div>

                                    {/* Show Single vs Bulk Info */}
                                    <div className="detail-row highlight">
                                        <span className="label">Hiring Mode:</span>
                                        <span className="value">
                                            {app.job?.vacancyType === 'BULK' ? '👥 Bulk Hiring (Group)' : '👤 Single Hiring'}
                                        </span>
                                    </div>

                                    {app.employerNotes && (
                                        <div className="detail-row notes">
                                            <span className="label">Employer Note:</span>
                                            <span className="value">{app.employerNotes}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="app-actions">
                                    <button
                                        className="btn-view-job"
                                        onClick={() => navigate(`/jobs/${app.job?._id}`)}
                                        disabled={!app.job}
                                    >
                                        View Job
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyApplications;
