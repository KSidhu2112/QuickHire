import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { applicationAPI, authAPI } from '../../services/api';
import { toast } from 'react-toastify';
import '../employer/HiredEmployees.css';
import './EmployeeDashboard.css'; // Reusing dashboard styles

const renderStars = (rating) => {
    const val = typeof rating === 'number' ? Math.round(rating) : 0;
    if (val === 5) return '⭐⭐⭐⭐⭐';
    if (val === 4) return '⭐⭐⭐⭐☆';
    if (val === 3) return '⭐⭐⭐☆☆';
    if (val === 2) return '⭐⭐☆☆☆';
    if (val === 1) return '⭐☆☆☆☆';
    return '☆☆☆☆☆';
};

const ShortlistedJobs = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showJobModal, setShowJobModal] = useState(false);

    // Rating states
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showViewReviewModal, setShowViewReviewModal] = useState(false);
    const [selectedApp, setSelectedApp] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        // Check if user is logged in and is a jobseeker
        const storedUser = authAPI.getStoredUser();
        const token = localStorage.getItem('quickhire_token');

        // Check if user is logged in
        if (!token || !storedUser) {
            toast.error('Please log in to continue');
            navigate('/');
            return;
        }

        // Check if user is a jobseeker
        if (storedUser.role !== 'jobseeker') {
            toast.error('This page is only accessible to job seekers');
            // Redirect employers to their dashboard
            if (storedUser.role === 'employer') {
                navigate('/employer/dashboard');
            } else {
                navigate('/');
            }
            return;
        }

        fetchShortlistedJobs();
    }, [navigate]);

    const fetchShortlistedJobs = async () => {
        setLoading(true);
        try {
            // Fetch applications with status 'ACCEPTED'
            const response = await applicationAPI.getUserApplications({ status: 'ACCEPTED' });
            setApplications(response.applications || []);
        } catch (error) {
            console.error('Error fetching shortlisted jobs:', error);

            // Handle 403 Forbidden - user might be logged in with wrong role
            if (error.response?.status === 403) {
                toast.error('Access denied. You must be logged in as a job seeker to view this page.');
                authAPI.logout();
                navigate('/');
            } else if (error.response?.status === 401) {
                // Handle 401 Unauthorized - token expired or invalid
                toast.error('Your session has expired. Please log in again.');
                authAPI.logout();
                navigate('/');
            } else {
                // Handle other errors
                toast.error(error.response?.data?.message || 'Failed to load shortlisted jobs');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmWork = async (app) => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.post(`http://localhost:5000/api/verification/${app._id}/employee-confirm`, {
                status: 'FULL_PAYMENT',
                feedback: 'Work completed successfully',
                rating: 5
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success('Work confirmed done successfully!');
                fetchShortlistedJobs();
            }
        } catch (err) {
            console.error('Error confirming work:', err);
            toast.error(err.response?.data?.message || 'Failed to confirm work');
        }
    };

    const handleConfirmPaymentReceived = async (app) => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.post(`http://localhost:5000/api/applications/${app._id}/confirm-payment`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success('Payment confirmed received successfully!');
                fetchShortlistedJobs();
            }
        } catch (err) {
            console.error('Error confirming payment:', err);
            toast.error(err.response?.data?.message || 'Failed to confirm payment');
        }
    };

    const openRatingModal = (app) => {
        setSelectedApp(app);
        setRating(0);
        setReviewComment('');
        setShowRatingModal(true);
    };

    const closeRatingModal = () => {
        setShowRatingModal(false);
        setSelectedApp(null);
    };

    const openViewReviewModal = (app, review) => {
        setSelectedApp(app);
        setSelectedReview(review);
        setShowViewReviewModal(true);
    };

    const closeViewReviewModal = () => {
        setShowViewReviewModal(false);
        setSelectedApp(null);
        setSelectedReview(null);
    };

    const handleSubmitReview = async () => {
        if (rating === 0) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.post('http://localhost:5000/api/reviews', {
                revieweeId: selectedApp.employer._id,
                jobId: selectedApp.job._id,
                rating,
                comment: reviewComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Review submitted successfully!');
                closeRatingModal();
                fetchShortlistedJobs(); // Refresh list to show new review
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const handleJobClick = (job) => {
        setSelectedJob(job);
        setShowJobModal(true);
    };

    const closeJobModal = () => {
        setShowJobModal(false);
        setSelectedJob(null);
    };

    const getGoogleMapsUrl = (location) => {
        if (!location) return '';
        if (typeof location === 'string') return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

        const addressParts = [
            location.address,
            location.city,
            location.state,
            location.zipCode
        ].filter(Boolean);
        const query = encodeURIComponent(addressParts.join(', '));
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    };

    return (
        <div className="employee-dashboard">
            <div className="dashboard-header">
                <div className="dashboard-title-section">
                    <button className="back-button" onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', marginRight: '10px' }}>
                        ←
                    </button>
                    <div style={{ display: 'inline-block' }}>
                        <h1>Shortlisted Jobs</h1>
                        <p>Congratulations! You have been shortlisted for these positions.</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-content" style={{ display: 'block' }}>
                <main className="dashboard-main">
                    {loading ? (
                        <div className="loading-container">
                            <div className="loader"></div>
                            <p>Loading shortlisted jobs...</p>
                        </div>
                    ) : applications.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">🎉</div>
                            <h3>No shortlisted jobs yet</h3>
                            <p>Keep applying! Once an employer shortlists you, the jobs will appear here.</p>
                            <button className="btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: '20px' }}>
                                Browse Jobs
                            </button>
                        </div>
                    ) : (
                        <div className="jobs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '30px' }}>
                            {applications.map((app) => {
                                const bothRated = (app.ratingPublished || (app.employerRated && app.employeeRated)) && app.review && app.receivedReview;
                                return (
                                    <div key={app._id} className="hired-card">
                                        <div className="hired-card-header">
                                            <div>
                                                <h3 className="hired-card-title">{app.job?.title || 'Unknown Role'}</h3>
                                            </div>
                                            <span className="hired-badge">HIRED</span>
                                        </div>

                                        <div className="hired-card-subtitle">
                                            <span>Employer: <strong>{app.employer?.name || 'Unknown Employer'}</strong></span>
                                            <span>Date: <strong>{app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : new Date(app.updatedAt).toLocaleDateString()}</strong></span>
                                        </div>

                                        <div className="hired-card-contact" style={{
                                            display: 'flex',
                                            gap: '20px',
                                            flexWrap: 'wrap',
                                            padding: '8px 16px',
                                            margin: '0 0 4px 0',
                                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                            borderRadius: '8px',
                                            fontSize: '13.5px',
                                            color: '#334155'
                                        }}>
                                            {app.employer?.email && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '15px' }}>📧</span>
                                                    <a href={`mailto:${app.employer.email}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                                                        {app.employer.email}
                                                    </a>
                                                </span>
                                            )}
                                            {app.employer?.phone && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontSize: '15px' }}>📞</span>
                                                    <a href={`tel:${app.employer.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                                                        {app.employer.phone}
                                                    </a>
                                                </span>
                                            )}
                                        </div>

                                        <div className="hired-status-container">
                                            <div className="status-column">
                                                <span className="status-column-title">Employer Side</span>
                                                <span className={`status-item ${app.employerRated ? 'success' : 'danger'}`}>
                                                    {app.employerRated ? '✓' : '✗'} Rated
                                                </span>
                                                <span className={`status-item ${app.employerConfirmation?.confirmed ? 'success' : 'danger'}`}>
                                                    {app.employerConfirmation?.confirmed ? '✓' : '✗'} Work Done
                                                </span>
                                                <span className={`status-item ${app.isPaid ? 'success' : 'danger'}`}>
                                                    {app.isPaid ? '✓ Paid' : '✗ Payment Pending'}
                                                </span>
                                            </div>
                                            <div className="status-column">
                                                <span className="status-column-title">Employee Side</span>
                                                <span className={`status-item ${app.employeeRated ? 'success' : 'danger'}`}>
                                                    {app.employeeRated ? '✓' : '✗'} Rated
                                                </span>
                                                <span className={`status-item ${app.employeeConfirmation?.confirmed ? 'success' : 'danger'}`}>
                                                    {app.employeeConfirmation?.confirmed ? '✓' : '✗'} Work Done
                                                </span>
                                                <span className={`status-item ${app.paymentReceived ? 'success' : 'danger'}`}>
                                                    {app.paymentReceived ? '✓ Received' : '✗ Not Received'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="hired-card-actions">
                                            {bothRated ? (
                                                <>
                                                    <span className="hired-btn hired-btn-success" style={{ cursor: 'default' }}>
                                                        <span className="icon">✓</span> Mutual Rating Complete
                                                    </span>
                                                    <div className="ratings-stack" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '6px' }}>
                                                        <button className="hired-rating-display" onClick={() => openViewReviewModal(app, app.review)} style={{ width: 'fit-content' }}>
                                                            📝 Your Rating → {app.employer?.name}: {renderStars(app.review.stars)}
                                                        </button>
                                                        <button className="hired-rating-display received" style={{ width: 'fit-content' }} onClick={() => openViewReviewModal(app, app.receivedReview)}>
                                                            📩 {app.employer?.name}'s Rating → You: {renderStars(app.receivedReview.stars)}
                                                        </button>
                                                    </div>
                                                </>
                                            ) : app.employeeRated ? (
                                                <span className="hired-btn hired-btn-orange" style={{ opacity: 0.7, cursor: 'default' }}>
                                                    <span className="icon">⏳</span> Waiting for Employer Rating
                                                </span>
                                            ) : (
                                                <button className="hired-btn hired-btn-orange" onClick={() => openRatingModal(app)}>
                                                    <span className="icon">⭐</span> Rate Employer
                                                </button>
                                            )}

                                            {app.workStatus === 'COMPLETED' || (app.employerConfirmation?.confirmed && app.employeeConfirmation?.confirmed) ? (
                                                <span className="hired-btn hired-btn-success">
                                                    <span className="icon">✓</span> Work Verified
                                                </span>
                                            ) : app.employeeConfirmation?.confirmed ? (
                                                <span className="hired-btn hired-btn-success" style={{ opacity: 0.7, cursor: 'default' }}>
                                                    <span className="icon">⏳</span> Waiting for Employer Confirm
                                                </span>
                                            ) : (
                                                <button className="hired-btn hired-btn-success filled" onClick={() => handleConfirmWork(app)}>
                                                    <span className="icon">✓</span> Confirm Work Done
                                                </button>
                                            )}

                                            {!app.paymentReceived && (
                                                <button className="hired-btn hired-btn-purple" onClick={() => handleConfirmPaymentReceived(app)}>
                                                    <span className="icon">💰</span> Mark Payment Received
                                                </button>
                                            )}

                                            <button className="hired-btn hired-btn-purple" onClick={() => handleJobClick(app.job)}>
                                                <span className="icon">💼</span> Job Details
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* Rating Modal */}
            {showRatingModal && selectedApp && (
                <div className="modal-overlay" onClick={closeRatingModal}>
                    <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={closeRatingModal}>✕</button>
                        <h2>Rate {selectedApp.employer?.name}</h2>
                        <p className="job-title-modal">for {selectedApp.job?.title}</p>

                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    className={`star ${star <= rating ? 'filled' : ''}`}
                                    onClick={() => setRating(star)}
                                >
                                    ★
                                </span>
                            ))}
                        </div>

                        <textarea
                            placeholder="Share your experience working with this employer..."
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            rows="4"
                            className="review-textarea"
                        ></textarea>

                        <button
                            className="submit-review-btn"
                            onClick={handleSubmitReview}
                            disabled={rating === 0 || submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </div>
            )}

            {/* View Review Modal */}
            {showViewReviewModal && selectedApp && selectedReview && (() => {
                const currentUser = JSON.parse(localStorage.getItem('quickhire_user') || '{}');
                const isOwnReview = selectedReview.reviewer === currentUser._id;
                return (
                    <div className="modal-overlay" onClick={closeViewReviewModal}>
                        <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="close-modal" onClick={closeViewReviewModal}>✕</button>
                            <h2>{isOwnReview ? `Your Review for ${selectedApp.employer?.name}` : `Review from ${selectedApp.employer?.name}`}</h2>
                            <p className="job-title-modal">Job: {selectedApp.job?.title}</p>

                            <div className="rating-stars readonly">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <span
                                        key={star}
                                        className={`star ${star <= selectedReview.stars ? 'filled' : ''}`}
                                    >
                                        ★
                                    </span>
                                ))}
                            </div>

                            <div className="review-content">
                                <p>{selectedReview.feedback}</p>
                                <span className="review-date">Submitted on: {new Date(selectedReview.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Job Details Modal - Reusing from EmployeeDashboard */}
            {showJobModal && selectedJob && (
                <div className="modal-overlay" onClick={closeJobModal}>
                    <div className="job-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={closeJobModal}>✕</button>

                        <div className="modal-header">
                            <h2>{selectedJob.title}</h2>
                            <p className="company-name">{selectedJob.company}</p>
                            <span className="job-status accepted" style={{
                                display: 'inline-block',
                                marginTop: '8px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                background: '#dcfce7',
                                color: '#166534',
                                fontSize: '12px',
                                fontWeight: '600'
                            }}>
                                SHORTLISTED
                            </span>
                        </div>

                        <div className="modal-content">
                            <div className="job-detail-section">
                                <h3>Location</h3>
                                <p className="location-text">
                                    <span className="icon">📍</span>
                                    {selectedJob.location ? (
                                        <a
                                            href={getGoogleMapsUrl(selectedJob.location)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="location-link"
                                            title="View on Google Maps"
                                        >
                                            {[
                                                selectedJob.location?.address,
                                                selectedJob.location?.city,
                                                selectedJob.location?.state,
                                                selectedJob.location?.zipCode
                                            ].filter(Boolean).join(', ') || (typeof selectedJob.location === 'string' ? selectedJob.location : 'Location not available')}
                                            <span className="external-link-icon"> ↗</span>
                                        </a>
                                    ) : (
                                        'Location not specified'
                                    )}
                                </p>
                            </div>

                            <div className="job-detail-section">
                                <h3>Job Description</h3>
                                <p>{selectedJob.description}</p>
                            </div>

                            <div className="job-detail-grid">
                                <div className="detail-item">
                                    <span className="label">Salary:</span>
                                    <span className="value">
                                        {selectedJob.salaryMin} - {selectedJob.salaryMax} {selectedJob.salaryType}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Job Type:</span>
                                    <span className="value">{selectedJob.jobType?.replace('_', ' ')}</span>
                                </div>
                                {selectedJob.experience && (
                                    <div className="detail-item">
                                        <span className="label">Experience:</span>
                                        <span className="value">{selectedJob.experience}</span>
                                    </div>
                                )}
                            </div>

                            {selectedJob.skills && selectedJob.skills.length > 0 && (
                                <div className="job-detail-section">
                                    <h3>Required Skills</h3>
                                    <div className="skills-list">
                                        {selectedJob.skills.map((skill, index) => (
                                            <span key={index} className="skill-tag">{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={closeJobModal}>
                                Close
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => {
                                    closeJobModal();
                                }}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShortlistedJobs;
