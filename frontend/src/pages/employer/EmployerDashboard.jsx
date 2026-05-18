import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './EmployerDashboard.css';

const EmployerDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [recentJobs, setRecentJobs] = useState([]);
    const [recentApplications, setRecentApplications] = useState([]);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showJobModal, setShowJobModal] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        fetchDashboardStats();
        fetchRecentJobs();
        fetchRecentApplications();
        fetchEmployerProfile();
    }, []);

    const fetchEmployerProfile = async () => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.get('http://localhost:5000/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setUser(response.data.user);
            }
        } catch (err) {
            console.error('Error fetching employer profile:', err);
        }
    };

    const fetchDashboardStats = async () => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.get('http://localhost:5000/api/employer/dashboard/stats', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);

            // Handle invalid/expired token
            if (err.response?.status === 401) {
                setError('Session expired. Redirecting to login...');
                localStorage.removeItem('quickhire_token');
                localStorage.removeItem('quickhire_user');
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else {
                setError(err.response?.data?.message || 'Failed to fetch dashboard stats');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentJobs = async () => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.get('http://localhost:5000/api/jobs/employer/my-jobs', {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: 4 }
            });

            if (response.data.success) {
                setRecentJobs(response.data.jobs);
            }
        } catch (err) {
            console.error('Error fetching recent jobs:', err);
        }
    };

    const fetchRecentApplications = async () => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.get('http://localhost:5000/api/employer/applications', {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    limit: 5,
                    status: 'APPLIED' // Only fetch new, pending applications
                }
            });

            if (response.data.success) {
                setRecentApplications(response.data.applications);
            }
        } catch (err) {
            console.error('Error fetching recent applications:', err);
        }
    };

    const handleJobClick = async (jobId) => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.get(`http://localhost:5000/api/jobs/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setSelectedJob(response.data.job);
                setShowJobModal(true);
            }
        } catch (err) {
            console.error('Error fetching job details:', err);
            setError('Failed to load job details');
        }
    };

    const closeJobModal = () => {
        setShowJobModal(false);
        setSelectedJob(null);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="employer-dashboard">
            <div className="dashboard-container">
                {/* Header */}
                <div className="dashboard-header">
                    <h1>Employer Dashboard</h1>
                    <p className="subtitle">Manage your jobs and applications</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Stats Cards */}
                {stats && (
                    <div className="stats-grid">
                        {user?.stats?.avgRating !== undefined && (
                            <div className="stat-card rating">
                                <div className="stat-icon">⭐</div>
                                <div className="stat-info">
                                    <h3>{user.stats.avgRating > 0 ? user.stats.avgRating.toFixed(1) : '0.0'}</h3>
                                    <p>My Rating ({user.stats.ratingCount || 0} reviews)</p>
                                </div>
                            </div>
                        )}

                        {user?.trustScore !== undefined && (
                            <div className="stat-card rating">
                                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>🛡️</div>
                                <div className="stat-info">
                                    <h3>{user.trustScore}</h3>
                                    <p>Trust Score</p>
                                </div>
                            </div>
                        )}

                        <div className="stat-card primary">
                            <div className="stat-icon">📋</div>
                            <div className="stat-info">
                                <h3>{stats.totalJobs}</h3>
                                <p>Total Jobs Posted</p>
                            </div>
                        </div>

                        <div className="stat-card success">
                            <div className="stat-icon">✅</div>
                            <div className="stat-info">
                                <h3>{stats.activeJobs}</h3>
                                <p>Active Jobs</p>
                            </div>
                        </div>

                        <div className="stat-card info">
                            <div className="stat-icon">📨</div>
                            <div className="stat-info">
                                <h3>{stats.totalApplications}</h3>
                                <p>Applications Received</p>
                            </div>
                        </div>

                        <div className="stat-card warning">
                            <div className="stat-icon">👥</div>
                            <div className="stat-info">
                                <h3>{stats.employeesHired}</h3>
                                <p>Employees Hired</p>
                            </div>
                        </div>

                        <div className="stat-card urgent">
                            <div className="stat-icon">📅</div>
                            <div className="stat-info">
                                <h3>{stats.todaysDailyJobs}</h3>
                                <p>Today's Daily Jobs</p>
                            </div>
                        </div>

                        <div className="stat-card pending">
                            <div className="stat-icon">⏳</div>
                            <div className="stat-info">
                                <h3>{stats.pendingApplications}</h3>
                                <p>Pending Applications</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recent Applications Section - NEW */}
                {recentApplications.length > 0 && (
                    <div className="recent-section">
                        <div className="section-header">
                            <h2>Recent Applications</h2>
                            <button
                                className="view-all-btn"
                                onClick={() => navigate('/employer/applications')}
                            >
                                View All →
                            </button>
                        </div>
                        <div className="recent-applications-list">
                            {recentApplications.map((app) => (
                                <div key={app._id} className="app-card-mini">
                                    <div className="app-avatar-mini">
                                        {app.jobseeker?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="app-info-mini">
                                        <h4>{app.jobseeker?.name}</h4>
                                        <p>Applied for <strong>{app.job?.title}</strong></p>
                                    </div>
                                    <div className="app-time-mini">
                                        {new Date(app.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Jobs Section */}
                {recentJobs.length > 0 && (
                    <div className="recent-jobs-section">
                        <div className="section-header">
                            <h2>Recent Jobs</h2>
                            <button
                                className="view-all-btn"
                                onClick={() => navigate('/employer/manage-jobs')}
                            >
                                View All →
                            </button>
                        </div>
                        <div className="recent-jobs-grid">
                            {recentJobs.map((job) => (
                                <div
                                    key={job._id}
                                    className="job-card"
                                    onClick={() => handleJobClick(job._id)}
                                >
                                    <div className="job-card-header">
                                        <h3>{job.title || 'Untitled Job'}</h3>
                                        {job.status && (
                                            <span className={`job-status ${job.status.toLowerCase()}`}>
                                                {job.status}
                                            </span>
                                        )}
                                    </div>
                                    <div className="job-card-details">
                                        <p className="job-type">
                                            <span className="icon">💼</span>
                                            {job.jobType ? job.jobType.replace('_', ' ') : 'N/A'}
                                        </p>
                                        <p className="job-location">
                                            <span className="icon">📍</span>
                                            {job.location?.city || 'N/A'}
                                        </p>
                                        <p className="job-salary">
                                            <span className="icon">💰</span>
                                            {job.salary && job.salary.min && job.salary.max
                                                ? `₹${job.salary.min} - ₹${job.salary.max}`
                                                : 'To be discussed'
                                            }
                                        </p>
                                    </div>
                                    <div className="job-card-footer">
                                        <span className="applicants">
                                            👥 {job.totalApplicants || 0} applicants
                                        </span>
                                        <span className="posted-date">
                                            Posted {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recently'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="quick-actions">
                    <h2>Quick Actions</h2>
                    <div className="action-grid">
                        <button
                            className="action-card add-job"
                            onClick={() => navigate('/employer/add-job')}
                        >
                            <span className="action-icon">➕</span>
                            <h3>Add New Job</h3>
                            <p>Post a new job opportunity</p>
                        </button>

                        <button
                            className="action-card manage-jobs"
                            onClick={() => navigate('/employer/manage-jobs')}
                        >
                            <span className="action-icon">📝</span>
                            <h3>Manage Jobs</h3>
                            <p>Edit or close existing jobs</p>
                        </button>

                        <button
                            className="action-card applications"
                            onClick={() => navigate('/employer/applications')}
                        >
                            <span className="action-icon">📥</span>
                            <h3>View Applications</h3>
                            <p>Review and manage applications</p>
                        </button>

                        <button
                            className="action-card hired"
                            onClick={() => navigate('/employer/hired-employees')}
                        >
                            <span className="action-icon">👔</span>
                            <h3>Hired Employees</h3>
                            <p>Manage your workforce</p>
                        </button>

                        <button
                            className="action-card payments"
                            onClick={() => navigate('/employer/payments')}
                        >
                            <span className="action-icon">💰</span>
                            <h3>Payments</h3>
                            <p>View payment summary</p>
                        </button>

                        <button
                            className="action-card profile"
                            onClick={() => navigate('/employer/profile')}
                        >
                            <span className="action-icon">⚙️</span>
                            <h3>Settings</h3>
                            <p>Update your profile</p>
                        </button>
                    </div>
                </div>

                {/* Job Type Breakdown */}
                {stats && stats.jobsByType && stats.jobsByType.length > 0 && (
                    <div className="job-breakdown">
                        <h2>Jobs by Type</h2>
                        <div className="breakdown-grid">
                            {stats.jobsByType.map((job) => (
                                <div key={job._id} className="breakdown-card">
                                    <h4>
                                        {job._id === 'PART_TIME'
                                            ? 'Part-Time'
                                            : job._id === 'FULL_TIME'
                                                ? 'Full-Time'
                                                : 'Daily Jobs'}
                                    </h4>
                                    <div className="breakdown-stats">
                                        <div className="stat-item">
                                            <span className="label">Jobs:</span>
                                            <span className="value">{job.count}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="label">Applications:</span>
                                            <span className="value">{job.totalApplicants}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Job Details Modal */}
            {showJobModal && selectedJob && (
                <div className="modal-overlay" onClick={closeJobModal}>
                    <div className="job-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={closeJobModal}>✕</button>

                        <div className="modal-header">
                            <h2>{selectedJob.title || 'Job Details'}</h2>
                            {selectedJob.status && (
                                <span className={`job-status ${selectedJob.status.toLowerCase()}`}>
                                    {selectedJob.status}
                                </span>
                            )}
                        </div>

                        <div className="modal-content">
                            <div className="job-detail-section">
                                <h3>Job Information</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Company:</span>
                                        <span className="detail-value">{selectedJob.company || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Job Type:</span>
                                        <span className="detail-value">{selectedJob.jobType ? selectedJob.jobType.replace('_', ' ') : 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Location:</span>
                                        <span className="detail-value">
                                            {[
                                                selectedJob.location?.address,
                                                selectedJob.location?.city,
                                                selectedJob.location?.state,
                                                selectedJob.location?.zipCode
                                            ].filter(Boolean).join(', ') || 'N/A'}
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Salary Range:</span>
                                        <span className="detail-value">
                                            {selectedJob.salary && selectedJob.salary.min && selectedJob.salary.max
                                                ? `₹${selectedJob.salary.min} - ₹${selectedJob.salary.max}`
                                                : 'To be discussed'
                                            }
                                        </span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Openings:</span>
                                        <span className="detail-value">{selectedJob.openings || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Posted:</span>
                                        <span className="detail-value">
                                            {selectedJob.createdAt ? new Date(selectedJob.createdAt).toLocaleDateString() : 'N/A'}
                                        </span>
                                    </div>
                                    {selectedJob.jobType === 'DAILY' && selectedJob.workDate && (
                                        <div className="detail-item">
                                            <span className="detail-label">Work Date:</span>
                                            <span className="detail-value">
                                                {new Date(selectedJob.workDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="job-detail-section">
                                <h3>Description</h3>
                                <p className="job-description">{selectedJob.description || 'No description available'}</p>
                            </div>

                            {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                                <div className="job-detail-section">
                                    <h3>Requirements</h3>
                                    <ul className="requirements-list">
                                        {selectedJob.requirements.map((req, index) => (
                                            <li key={index}>{req}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                                <div className="job-detail-section">
                                    <h3>Benefits</h3>
                                    <ul className="benefits-list">
                                        {selectedJob.benefits.map((benefit, index) => (
                                            <li key={index}>{benefit}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="job-detail-section">
                                <h3>Contact Information</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <span className="detail-label">Email:</span>
                                        <span className="detail-value">{selectedJob.contactEmail || 'N/A'}</span>
                                    </div>
                                    <div className="detail-item">
                                        <span className="detail-label">Phone:</span>
                                        <span className="detail-value">{selectedJob.contactPhone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="job-detail-section">
                                <h3>Applications</h3>
                                <p className="applicants-count">
                                    Total Applicants: <strong>{selectedJob.totalApplicants || 0}</strong>
                                </p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => {
                                    navigate(`/employer/applications?job=${selectedJob._id}`);
                                    closeJobModal();
                                }}
                            >
                                View Applications
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    navigate('/employer/manage-jobs');
                                    closeJobModal();
                                }}
                            >
                                Edit Job
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployerDashboard;
