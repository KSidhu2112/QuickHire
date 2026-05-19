import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'https://quickhire-9ous.onrender.com/api';
import './ManageJobs.css';

const ManageJobs = () => {
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.get(`${API_BASE}/jobs/employer/my-jobs`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setJobs(response.data.jobs);
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
            setError(err.response?.data?.message || 'Failed to fetch jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseJob = async (jobId) => {
        if (!window.confirm('Are you sure you want to close this job?')) return;

        try {
            const token = localStorage.getItem('quickhire_token');
            await axios.put(
                `${API_BASE}/jobs/${jobId}`,
                { status: 'CLOSED' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchJobs();
        } catch (err) {
            console.error('Error closing job:', err);
            alert(err.response?.data?.message || 'Failed to close job');
        }
    };

    const handleToggleUrgent = async (jobId, currentStatus) => {
        try {
            const token = localStorage.getItem('quickhire_token');
            await axios.put(
                `${API_BASE}/jobs/${jobId}`,
                { isUrgent: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchJobs();
        } catch (err) {
            console.error('Error updating urgent status:', err);
            alert(err.response?.data?.message || 'Failed to update job');
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('quickhire_token');
            await axios.delete(`${API_BASE}/jobs/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            fetchJobs();
        } catch (err) {
            console.error('Error deleting job:', err);
            alert(err.response?.data?.message || 'Failed to delete job');
        }
    };

    const isJobFull = (job) => {
        const hired = job.workersHired || 0;
        const required = job.workersRequired || 0;
        return (required - hired) <= 0;
    };

    const filteredJobs = jobs.filter((job) => {
        if (filter === 'ALL') return true;

        // Active jobs are those that are explicitly ACTIVE and NOT full
        if (filter === 'ACTIVE') {
            return job.status === 'ACTIVE' && !isJobFull(job);
        }

        // Closed jobs include explicitly CLOSED jobs OR jobs that are full (completed)
        if (filter === 'CLOSED') {
            return job.status === 'CLOSED' || isJobFull(job);
        }

        if (filter === 'URGENT') return job.isUrgent;
        return job.jobType === filter;
    });

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading jobs...</p>
            </div>
        );
    }

    return (
        <div className="manage-jobs-page">
            <div className="manage-jobs-container">
                <div className="page-header">
                    <div className="header-left">
                        <button className="back-button" onClick={() => navigate('/employer/dashboard')}>
                            ← Back
                        </button>
                        <div>
                            <h1>Manage Jobs</h1>
                            <p>View and manage all your posted jobs</p>
                        </div>
                    </div>
                    <button className="post-job-btn" onClick={() => navigate('/employer/add-job')}>
                        ➕ Post New Job
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Filters */}
                <div className="filters">
                    <button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>
                        All Jobs ({jobs.length})
                    </button>
                    <button className={filter === 'ACTIVE' ? 'active' : ''} onClick={() => setFilter('ACTIVE')}>
                        Active ({jobs.filter((j) => j.status === 'ACTIVE').length})
                    </button>
                    <button className={filter === 'CLOSED' ? 'active' : ''} onClick={() => setFilter('CLOSED')}>
                        Closed ({jobs.filter((j) => j.status === 'CLOSED').length})
                    </button>
                    <button className={filter === 'URGENT' ? 'active' : ''} onClick={() => setFilter('URGENT')}>
                        Urgent ({jobs.filter((j) => j.isUrgent).length})
                    </button>
                    <button className={filter === 'PART_TIME' ? 'active' : ''} onClick={() => setFilter('PART_TIME')}>
                        Part-Time
                    </button>
                    <button className={filter === 'FULL_TIME' ? 'active' : ''} onClick={() => setFilter('FULL_TIME')}>
                        Full-Time
                    </button>
                    <button className={filter === 'DAILY' ? 'active' : ''} onClick={() => setFilter('DAILY')}>
                        Daily Jobs
                    </button>
                    <button className={filter === 'ON_CALL' ? 'active' : ''} onClick={() => setFilter('ON_CALL')}>
                        On-Call
                    </button>
                    <button className={filter === 'EVENT_BASED' ? 'active' : ''} onClick={() => setFilter('EVENT_BASED')}>
                        Event-Based
                    </button>
                    <button className={filter === 'SHIFT_BASED' ? 'active' : ''} onClick={() => setFilter('SHIFT_BASED')}>
                        Shift-Based
                    </button>
                </div>

                {/* Jobs List */}
                {filteredJobs.length === 0 ? (
                    <div className="no-jobs">
                        <p>📭 No jobs found</p>
                        <button onClick={() => navigate('/employer/add-job')}>Post Your First Job</button>
                    </div>
                ) : (
                    <div className="jobs-grid">
                        {filteredJobs.map((job) => (
                            <div key={job._id} className="job-card">
                                {/* Job Header */}
                                <div className="job-header">
                                    <div className="job-title-section">
                                        <h3>{job.title}</h3>
                                        <div className="job-badges">
                                            <span className={`badge ${job.jobType.toLowerCase()}`}>
                                                {job.jobType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </span>
                                            <span className={`badge status-${job.status.toLowerCase()}`}>
                                                {job.status}
                                            </span>
                                            {job.isUrgent && <span className="badge urgent">🔥 URGENT</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Job Info */}
                                <div className="job-info">
                                    <div className="info-item">
                                        <span className="icon">📍</span>
                                        <span>{job.location.city}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="icon">💰</span>
                                        <span>
                                            ₹{job.salaryMin}
                                            {job.salaryMax && job.salaryMax !== job.salaryMin && ` - ₹${job.salaryMax}`} /{' '}
                                            {job.salaryType.toLowerCase()}
                                        </span>
                                    </div>
                                    <div className="info-item">
                                        <span className="icon">👥</span>
                                        <span>
                                            Hired: {job.workersHired || 0} / Vacancies: {Math.max(0, job.workersRequired - (job.workersHired || 0))}
                                        </span>
                                    </div>
                                    {job.jobType === 'DAILY' && job.workDate && (
                                        <div className="info-item">
                                            <span className="icon">📅</span>
                                            <span>{formatDate(job.workDate)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Job Stats */}
                                <div className="job-stats">
                                    <div className="stat">
                                        <span className="stat-value">{job.views || 0}</span>
                                        <span className="stat-label">Views</span>
                                    </div>
                                    <div className="stat">
                                        <span className="stat-value">{job.applicants || 0}</span>
                                        <span className="stat-label">Applications</span>
                                    </div>
                                </div>

                                {/* Job Actions */}
                                <div className="job-actions">
                                    <button
                                        className="action-btn view"
                                        onClick={() => navigate(`/employer/applications?job=${job._id}`)}
                                    >
                                        📥 Applications
                                    </button>
                                    <button
                                        className="action-btn urgent-toggle"
                                        onClick={() => handleToggleUrgent(job._id, job.isUrgent)}
                                    >
                                        {job.isUrgent ? '⭐ Remove Urgent' : '🔥 Mark Urgent'}
                                    </button>
                                    {job.status === 'ACTIVE' && (
                                        <button className="action-btn close" onClick={() => handleCloseJob(job._id)}>
                                            🔒 Close Job
                                        </button>
                                    )}
                                    <button className="action-btn delete" onClick={() => handleDeleteJob(job._id)}>
                                        🗑️ Delete
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

export default ManageJobs;
