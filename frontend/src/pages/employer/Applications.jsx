import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applicationAPI } from '../../services/api';
import './Applications.css';

const Applications = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [error, setError] = useState('');
    const [selectedApp, setSelectedApp] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const jobIdFilter = searchParams.get('job');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            let response;
            if (jobIdFilter) {
                response = await applicationAPI.getJobApplications(jobIdFilter);
            } else {
                response = await applicationAPI.getEmployerApplications();
            }

            if (response.success) {
                setApplications(response.applications);
            }
        } catch (err) {
            console.error('Error fetching applications:', err);
            setError(err.response?.data?.message || 'Failed to fetch applications');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (appId, newStatus, notes = '') => {
        try {
            await applicationAPI.updateStatus(appId, newStatus, notes);
            fetchApplications();
            setShowModal(false);
            setSelectedApp(null);
        } catch (err) {
            console.error('Error updating status:', err);
            alert(err.response?.data?.message || 'Failed to update application');
        }
    };

    const filteredApplications = applications.filter((app) => {
        if (filter === 'ALL') {
            // Don't show accepted applications by default in All view, 
            // as they are in "Hired Employees" page
            return app.status !== 'ACCEPTED';
        }
        return app.status === filter;
    });

    const getStatusCount = (status) => {
        if (status === 'ALL') return applications.filter(app => app.status !== 'ACCEPTED').length;
        return applications.filter((app) => app.status === status).length;
    };

    const viewDetails = (app) => {
        setSelectedApp(app);
        setShowModal(true);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading applications...</p>
            </div>
        );
    }

    return (
        <div className="applications-page">
            <div className="applications-container">
                <div className="page-header">
                    <button className="back-button" onClick={() => navigate('/employer/dashboard')}>
                        ← Back
                    </button>
                    <h1>Applications</h1>
                    <p>Review and manage candidate applications</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                {/* Filters */}
                <div className="filters">
                    <button className={filter === 'ALL' ? 'active' : ''} onClick={() => setFilter('ALL')}>
                        All ({getStatusCount('ALL')})
                    </button>
                    <button className={filter === 'APPLIED' ? 'active' : ''} onClick={() => setFilter('APPLIED')}>
                        New ({getStatusCount('APPLIED')})
                    </button>
                    <button className={filter === 'UNDER_REVIEW' ? 'active' : ''} onClick={() => setFilter('UNDER_REVIEW')}>
                        Shortlisted ({getStatusCount('UNDER_REVIEW')})
                    </button>
                    {/* Accepted applications are shown in Hired Employees page
                    <button className={filter === 'ACCEPTED' ? 'active' : ''} onClick={() => setFilter('ACCEPTED')}>
                        Accepted ({getStatusCount('ACCEPTED')})
                    </button>
                    */}
                    <button className={filter === 'REJECTED' ? 'active' : ''} onClick={() => setFilter('REJECTED')}>
                        Rejected ({getStatusCount('REJECTED')})
                    </button>
                </div>

                {/* Applications List */}
                {filteredApplications.length === 0 ? (
                    <div className="no-applications">
                        <p>📭 No applications found</p>
                    </div>
                ) : (
                    <div className="applications-grid">
                        {filteredApplications.map((app) => (
                            <div key={app._id} className="application-card">
                                <div className="app-header">
                                    <div className="candidate-info">
                                        <div className="candidate-avatar">
                                            {app.jobseeker?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3>{app.jobseeker?.name}</h3>
                                            <div className="candidate-meta">
                                                <p className="email">{app.jobseeker?.email}</p>
                                                <div className="candidate-rating">
                                                    <span className="star">★</span>
                                                    <span>{app.jobseeker?.stats?.avgRating ? app.jobseeker.stats.avgRating.toFixed(1) : '0.0'}</span>
                                                    <span className="rating-count">({app.jobseeker?.stats?.ratingCount || 0})</span>
                                                </div>
                                            </div>
                                            {app.jobseeker?.phone && <p className="phone">📞 {app.jobseeker.phone}</p>}
                                        </div>
                                    </div>
                                    <span className={`status-badge ${app.status.toLowerCase()}`}>
                                        {app.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="app-details">
                                    <h4>Applied For:</h4>
                                    <p className="job-title">{app.job?.title}</p>
                                    <div className="job-info">
                                        <span className="job-type">
                                            {app.job?.jobType === 'PART_TIME'
                                                ? 'Part-Time'
                                                : app.job?.jobType === 'FULL_TIME'
                                                    ? 'Full-Time'
                                                    : 'Daily'}
                                        </span>
                                        <span className="location">📍 {app.job?.location?.city}</span>
                                    </div>

                                    {app.jobseeker?.profile?.skills && app.jobseeker.profile.skills.length > 0 && (
                                        <div className="skills-section">
                                            <h5>Skills:</h5>
                                            <div className="skills-list">
                                                {app.jobseeker.profile.skills.slice(0, 3).map((skill, index) => (
                                                    <span key={index} className="skill-tag">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {app.jobseeker.profile.skills.length > 3 && (
                                                    <span className="skill-tag more">
                                                        +{app.jobseeker.profile.skills.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {app.availability && (
                                        <div className="availability">
                                            <strong>Availability:</strong> {app.availability}
                                        </div>
                                    )}
                                </div>

                                <div className="app-actions">
                                    <button className="action-btn view" onClick={() => viewDetails(app)}>
                                        👁️ View Details
                                    </button>
                                    {app.status === 'APPLIED' && (
                                        <>
                                            <button
                                                className="action-btn shortlist"
                                                onClick={() => handleStatusChange(app._id, 'UNDER_REVIEW')}
                                            >
                                                ⭐ Shortlist
                                            </button>
                                            <button
                                                className="action-btn accept"
                                                onClick={() => handleStatusChange(app._id, 'ACCEPTED')}
                                            >
                                                ✅ Accept
                                            </button>
                                            <button
                                                className="action-btn reject"
                                                onClick={() => handleStatusChange(app._id, 'REJECTED')}
                                            >
                                                ❌ Reject
                                            </button>
                                        </>
                                    )}
                                    {app.status === 'UNDER_REVIEW' && (
                                        <>
                                            <button
                                                className="action-btn accept"
                                                onClick={() => handleStatusChange(app._id, 'ACCEPTED')}
                                            >
                                                ✅ Accept
                                            </button>
                                            <button
                                                className="action-btn reject"
                                                onClick={() => handleStatusChange(app._id, 'REJECTED')}
                                            >
                                                ❌ Reject
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="app-footer">
                                    <span className="applied-date">
                                        Applied on {new Date(app.createdAt).toLocaleDateString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Application Details Modal */}
            {showModal && selectedApp && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowModal(false)}>
                            ✕
                        </button>

                        <div className="modal-header">
                            <div className="candidate-avatar-large">
                                {selectedApp.jobseeker?.name?.charAt(0).toUpperCase()}
                            </div>
                            <h2>{selectedApp.jobseeker?.name}</h2>
                            <div className="modal-candidate-meta">
                                <p>{selectedApp.jobseeker?.email}</p>
                                <div className="modal-candidate-rating">
                                    <span className="star">★</span>
                                    <span>{selectedApp.jobseeker?.stats?.avgRating ? selectedApp.jobseeker.stats.avgRating.toFixed(1) : '0.0'}</span>
                                    <span className="rating-count">({selectedApp.jobseeker?.stats?.ratingCount || 0} reviews)</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-body">
                            <div className="detail-section">
                                <h3>Applied For</h3>
                                <p className="job-title-large">{selectedApp.job?.title}</p>
                            </div>

                            {selectedApp.coverLetter && (
                                <div className="detail-section">
                                    <h3>Cover Letter</h3>
                                    <p className="cover-letter">{selectedApp.coverLetter}</p>
                                </div>
                            )}

                            {selectedApp.jobseeker?.profile?.bio && (
                                <div className="detail-section">
                                    <h3>About</h3>
                                    <p>{selectedApp.jobseeker.profile.bio}</p>
                                </div>
                            )}

                            {selectedApp.jobseeker?.profile?.skills && selectedApp.jobseeker.profile.skills.length > 0 && (
                                <div className="detail-section">
                                    <h3>Skills</h3>
                                    <div className="skills-list-modal">
                                        {selectedApp.jobseeker.profile.skills.map((skill, index) => (
                                            <span key={index} className="skill-tag">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedApp.jobseeker?.profile?.experience && (
                                <div className="detail-section">
                                    <h3>Experience</h3>
                                    <p>{selectedApp.jobseeker.profile.experience}</p>
                                </div>
                            )}

                            {selectedApp.jobseeker?.profile?.education && (
                                <div className="detail-section">
                                    <h3>Education</h3>
                                    <p>{selectedApp.jobseeker.profile.education}</p>
                                </div>
                            )}

                            {selectedApp.jobseeker?.phone && (
                                <div className="detail-section">
                                    <h3>Contact</h3>
                                    <p>📞 {selectedApp.jobseeker.phone}</p>
                                    <div className="contact-actions">
                                        <a href={`tel:${selectedApp.jobseeker.phone}`} className="contact-btn call">
                                            📞 Call Now
                                        </a>
                                        <a
                                            href={`https://wa.me/${selectedApp.jobseeker.phone.replace(/[^0-9]/g, '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="contact-btn whatsapp"
                                        >
                                            💬 WhatsApp
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Applications;
