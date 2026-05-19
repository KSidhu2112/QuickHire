import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applicationAPI, aiAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Applications.css';

const Applications = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [applications, setApplications] = useState([]);
    const [matchedWorkers, setMatchedWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const [filter, setFilter] = useState('ALL');
    const [error, setError] = useState('');
    const [selectedApp, setSelectedApp] = useState(null);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showWorkerModal, setShowWorkerModal] = useState(false);
    const [hiringId, setHiringId] = useState(null);

    const jobIdFilter = searchParams.get('job');

    useEffect(() => {
        fetchApplications();
        if (jobIdFilter) {
            fetchMatchedWorkers();
        }
    }, [jobIdFilter]);

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

    const fetchMatchedWorkers = async () => {
        if (!jobIdFilter) return;
        setLoadingMatches(true);
        try {
            const response = await aiAPI.getMatchedWorkers(jobIdFilter);
            if (response.success) {
                setMatchedWorkers(response.workers || []);
            }
        } catch (err) {
            console.error('Error fetching AI matched workers:', err);
        } finally {
            setLoadingMatches(false);
        }
    };

    const handleStatusChange = async (appId, newStatus, notes = '') => {
        try {
            await applicationAPI.updateStatus(appId, newStatus, notes);
            toast.success(`Application status updated to ${newStatus.replace('_', ' ')}!`);
            fetchApplications();
            setShowModal(false);
            setSelectedApp(null);
        } catch (err) {
            console.error('Error updating status:', err);
            toast.error(err.response?.data?.message || 'Failed to update application');
        }
    };

    const handleDirectHire = async (workerId, workerName) => {
        if (!jobIdFilter) return;
        setHiringId(workerId);
        try {
            const response = await applicationAPI.directHireWorker(jobIdFilter, workerId);
            if (response.success) {
                toast.success(`Successfully hired ${workerName}! Notification sent to employee. 🎉`);
                // Refresh both lists to keep UI synced
                fetchApplications();
                fetchMatchedWorkers();
            }
        } catch (err) {
            console.error('Error in direct hire:', err);
            toast.error(err.response?.data?.message || 'Failed to complete direct hire');
        } finally {
            setHiringId(null);
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
                    <button className={filter === 'REJECTED' ? 'active' : ''} onClick={() => setFilter('REJECTED')}>
                        Rejected ({getStatusCount('REJECTED')})
                    </button>
                    {jobIdFilter && (
                        <button 
                            className={`filter-btn-ai ${filter === 'AI_MATCH' ? 'active' : ''}`} 
                            onClick={() => setFilter('AI_MATCH')}
                            style={{
                                background: filter === 'AI_MATCH' ? 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' : '#e0e7ff',
                                color: filter === 'AI_MATCH' ? '#fff' : '#4f46e5',
                                fontWeight: '600',
                                border: 'none',
                                animation: 'pulse 2s infinite',
                                cursor: 'pointer'
                            }}
                        >
                            🤖 AI Matched Workers ({matchedWorkers.length})
                        </button>
                    )}
                </div>

                {/* Applications or Matched Workers List */}
                {filter === 'AI_MATCH' ? (
                    loadingMatches ? (
                        <div className="loading-container" style={{ padding: '60px 0' }}>
                            <div className="loading-spinner"></div>
                            <p>Querying AI Vector Search & generating explanations...</p>
                        </div>
                    ) : matchedWorkers.length === 0 ? (
                        <div className="no-applications">
                            <p>🤖 No AI-matched workers found for this job. Try updating the job's skills or description!</p>
                        </div>
                    ) : (
                        <div className="applications-grid">
                            {matchedWorkers.map((match) => {
                                // Check if worker is already hired in applications list
                                const isAlreadyHired = applications.some(
                                    app => app.jobseeker?._id === match.worker.id && app.status === 'ACCEPTED'
                                );

                                return (
                                    <div key={match.worker.id} className="application-card ai-match-card" style={{ border: '2px solid #7c3aed' }}>
                                        <div className="app-header">
                                            <div className="candidate-info">
                                                <div className="candidate-avatar" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                                                    {match.worker.name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3>{match.worker.name}</h3>
                                                    <div className="candidate-rating-box">
                                                        <div className="candidate-rating">
                                                            <span className="star">★</span>
                                                            <span>{match.worker.stats?.avgRating ? match.worker.stats.avgRating.toFixed(1) : '0.0'}</span>
                                                            <span className="rating-count">({match.worker.stats?.ratingCount || 0})</span>
                                                        </div>
                                                    </div>
                                                    <div className="contact-details">
                                                        <p className="email">📧 {match.worker.email || 'N/A'}</p>
                                                        <p className="phone">📞 {match.worker.phone || 'Not Provided'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <span 
                                                className="status-badge" 
                                                style={{ 
                                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                                    color: 'white',
                                                    fontWeight: '700',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                {match.scores.matchPercentage.toFixed(0)}% AI Match
                                            </span>
                                        </div>

                                        <div className="app-details">
                                            <div className="ai-explanation-box" style={{
                                                backgroundColor: '#faf5ff',
                                                borderLeft: '4px solid #a855f7',
                                                padding: '12px',
                                                borderRadius: '6px',
                                                marginBottom: '14px',
                                                fontSize: '0.92rem',
                                                color: '#5b21b6',
                                                fontStyle: 'italic',
                                                lineHeight: '1.4'
                                            }}>
                                                <strong>🤖 Why they match:</strong> "{match.aiExplanation || 'Excellent semantic overlap based on skills and profile details.'}"
                                            </div>

                                            {match.worker.profile?.skills && match.worker.profile.skills.length > 0 && (
                                                <div className="skills-section">
                                                    <h5>Skills:</h5>
                                                    <div className="skills-list">
                                                        {match.worker.profile.skills.map((skill, index) => {
                                                            const isMatched = match.skillOverlap?.matched?.some(
                                                                s => s.toLowerCase() === skill.toLowerCase()
                                                            );
                                                            return (
                                                                <span 
                                                                    key={index} 
                                                                    className={`skill-tag ${isMatched ? 'matched' : ''}`}
                                                                    style={{ 
                                                                        backgroundColor: isMatched ? '#d1fae5' : '#f3e8ff', 
                                                                        color: isMatched ? '#065f46' : '#6b21a8',
                                                                        border: isMatched ? '1px solid #34d399' : 'none',
                                                                        fontWeight: isMatched ? '600' : 'normal',
                                                                        padding: '4px 8px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.82rem',
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        gap: '2px'
                                                                    }}
                                                                >
                                                                    {isMatched ? '✓ ' : ''}{skill}
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {match.skillOverlap?.missing && match.skillOverlap.missing.length > 0 && (
                                                <div className="skills-section missing-skills" style={{ marginTop: '8px' }}>
                                                    <h5 style={{ color: '#ef4444' }}>Missing Required Skills:</h5>
                                                    <div className="skills-list">
                                                        {match.skillOverlap.missing.map((skill, index) => (
                                                            <span 
                                                                key={index} 
                                                                className="skill-tag missing"
                                                                style={{ 
                                                                    backgroundColor: '#fee2e2', 
                                                                    color: '#991b1b',
                                                                    border: '1px solid #fca5a5',
                                                                    fontWeight: '500',
                                                                    padding: '4px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '0.82rem',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '2px'
                                                                }}
                                                            >
                                                                ✗ {skill}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="matching-breakdown" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem', marginTop: '12px', color: '#4b5563' }}>
                                                <div>📍 <strong>Location:</strong> {match.scores.locationScore >= 90 ? 'Same City ✅' : 'Different City'}</div>
                                                <div>🛡️ <strong>Trust Score:</strong> {match.worker.trustScore || 100}/100</div>
                                                <div>⚡ <strong>Reliability:</strong> {match.scores.reliabilityScore || 100}%</div>
                                                <div>🕒 <strong>Availability:</strong> Available ✅</div>
                                            </div>
                                        </div>

                                        <div className="app-actions" style={{ marginTop: '16px' }}>
                                            <button 
                                                className="action-btn view" 
                                                onClick={() => {
                                                    setSelectedWorker(match);
                                                    setShowWorkerModal(true);
                                                }}
                                            >
                                                👁️ View Details
                                            </button>
                                            
                                            {isAlreadyHired ? (
                                                <button 
                                                    className="action-btn" 
                                                    disabled 
                                                    style={{ 
                                                        backgroundColor: '#d1fae5', 
                                                        color: '#065f46',
                                                        border: 'none',
                                                        cursor: 'not-allowed',
                                                        fontWeight: 'bold',
                                                        padding: '8px 16px',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    ✓ Hired & Notified
                                                </button>
                                            ) : (
                                                <button 
                                                    className="action-btn accept" 
                                                    onClick={() => handleDirectHire(match.worker.id, match.worker.name)}
                                                    disabled={hiringId === match.worker.id}
                                                    style={{ 
                                                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '8px 16px',
                                                        borderRadius: '6px'
                                                    }}
                                                >
                                                    {hiringId === match.worker.id ? 'Hiring...' : '⚡ Hire & Notify'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : filteredApplications.length === 0 ? (
                    <div className="no-applications">
                        <p>📭 No applications found</p>
                    </div>
                ) : (
                    <div className="applications-grid">
                        {filteredApplications.map((app) => (
                            <div key={app._id} className="application-card">
                                <div className="app-header">
                                    <div className="candidate-info" onClick={() => viewDetails(app)} style={{ cursor: 'pointer' }} title="Click to view details">
                                        <div className="candidate-avatar">
                                            {app.jobseeker?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3>{app.jobseeker?.name}</h3>
                                            <div className="candidate-rating-box">
                                                <div className="candidate-rating">
                                                    <span className="star">★</span>
                                                    <span>{app.jobseeker?.stats?.avgRating ? app.jobseeker.stats.avgRating.toFixed(1) : '0.0'}</span>
                                                    <span className="rating-count">({app.jobseeker?.stats?.ratingCount || 0})</span>
                                                </div>
                                            </div>
                                            <div className="contact-details">
                                                <p className="email">📧 {app.jobseeker?.email || 'N/A'}</p>
                                                <p className="phone">📞 {app.jobseeker?.phone || 'Not Provided'}</p>
                                            </div>
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
                                    {(app.status === 'APPLIED' || app.status === 'UNDER_REVIEW') && (
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

            {/* AI Worker Details Modal */}
            {showWorkerModal && selectedWorker && (
                <div className="modal-overlay" onClick={() => {
                    setShowWorkerModal(false);
                    setSelectedWorker(null);
                }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => {
                            setShowWorkerModal(false);
                            setSelectedWorker(null);
                        }}>
                            ✕
                        </button>

                        <div className="modal-header">
                            <div className="candidate-avatar-large" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}>
                                {selectedWorker.worker.name?.charAt(0).toUpperCase()}
                            </div>
                            <h2>{selectedWorker.worker.name}</h2>
                            <div className="modal-candidate-meta">
                                <p>{selectedWorker.worker.email}</p>
                                <div className="modal-candidate-rating">
                                    <span className="star">★</span>
                                    <span>{selectedWorker.worker.stats?.avgRating ? selectedWorker.worker.stats.avgRating.toFixed(1) : '0.0'}</span>
                                    <span className="rating-count">({selectedWorker.worker.stats?.ratingCount || 0} reviews)</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-body">
                            <div className="detail-section">
                                <div 
                                    className="ai-explanation-box" 
                                    style={{
                                        backgroundColor: '#faf5ff',
                                        borderLeft: '4px solid #a855f7',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        fontSize: '0.98rem',
                                        color: '#5b21b6',
                                        fontStyle: 'italic',
                                        lineHeight: '1.5'
                                    }}
                                >
                                    <strong>🤖 AI Explanation:</strong> "{selectedWorker.aiExplanation || 'Excellent match based on profile metrics and job requirements.'}"
                                </div>
                            </div>

                            {selectedWorker.worker.profile?.bio && (
                                <div className="detail-section">
                                    <h3>About Worker</h3>
                                    <p>{selectedWorker.worker.profile.bio}</p>
                                </div>
                            )}

                            {selectedWorker.worker.profile?.skills && selectedWorker.worker.profile.skills.length > 0 && (
                                <div className="detail-section">
                                    <h3>Skills</h3>
                                    <div className="skills-list-modal" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {selectedWorker.worker.profile.skills.map((skill, index) => {
                                            const isMatched = selectedWorker.skillOverlap?.matched?.some(
                                                s => s.toLowerCase() === skill.toLowerCase()
                                            );
                                            return (
                                                <span 
                                                    key={index} 
                                                    className={`skill-tag ${isMatched ? 'matched' : ''}`}
                                                    style={{
                                                        backgroundColor: isMatched ? '#d1fae5' : '#f3e8ff',
                                                        color: isMatched ? '#065f46' : '#6b21a8',
                                                        border: isMatched ? '1px solid #34d399' : 'none',
                                                        fontWeight: isMatched ? '600' : 'normal',
                                                        display: 'inline-block',
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    {isMatched ? '✓ ' : ''}{skill}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {selectedWorker.skillOverlap?.missing && selectedWorker.skillOverlap.missing.length > 0 && (
                                <div className="detail-section">
                                    <h3 style={{ color: '#ef4444' }}>Missing Required Skills</h3>
                                    <div className="skills-list-modal" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {selectedWorker.skillOverlap.missing.map((skill, index) => (
                                            <span 
                                                key={index} 
                                                className="skill-tag missing"
                                                style={{
                                                    backgroundColor: '#fee2e2',
                                                    color: '#991b1b',
                                                    border: '1px solid #fca5a5',
                                                    fontWeight: '500',
                                                    display: 'inline-block',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.9rem'
                                                }}
                                            >
                                                ✗ {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedWorker.worker.profile?.experience && (
                                <div className="detail-section">
                                    <h3>Experience</h3>
                                    <p>{selectedWorker.worker.profile.experience}</p>
                                </div>
                            )}

                            {selectedWorker.worker.profile?.education && (
                                <div className="detail-section">
                                    <h3>Education</h3>
                                    <p>{selectedWorker.worker.profile.education}</p>
                                </div>
                            )}

                            {selectedWorker.worker.phone && (
                                <div className="detail-section">
                                    <h3>Contact Info</h3>
                                    <p>📞 {selectedWorker.worker.phone}</p>
                                    <div className="contact-actions">
                                        <a href={`tel:${selectedWorker.worker.phone}`} className="contact-btn call">
                                            📞 Call Now
                                        </a>
                                        <a
                                            href={`https://wa.me/${selectedWorker.worker.phone.replace(/[^0-9]/g, '')}`}
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
