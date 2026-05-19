import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './HiredEmployees.css';

const renderStars = (rating) => {
    const val = typeof rating === 'number' ? Math.round(rating) : 0;
    if (val === 5) return '⭐⭐⭐⭐⭐';
    if (val === 4) return '⭐⭐⭐⭐☆';
    if (val === 3) return '⭐⭐⭐☆☆';
    if (val === 2) return '⭐⭐☆☆☆';
    if (val === 1) return '⭐☆☆☆☆';
    return '☆☆☆☆☆';
};

const HiredEmployees = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [showViewReviewModal, setShowViewReviewModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [rating, setRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const openRatingModal = (employee) => {
        setSelectedEmployee(employee);
        setRating(0);
        setReviewComment('');
        setShowRatingModal(true);
    };

    const closeRatingModal = () => {
        setShowRatingModal(false);
        setSelectedEmployee(null);
    };

    const openViewReviewModal = (employee, review) => {
        setSelectedEmployee(employee);
        setSelectedReview(review);
        setShowViewReviewModal(true);
    };

    const closeViewReviewModal = () => {
        setShowViewReviewModal(false);
        setSelectedEmployee(null);
        setSelectedReview(null);
    };

    const handleSubmitReview = async () => {
        if (rating === 0) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.post('http://localhost:5000/api/reviews', {
                revieweeId: selectedEmployee.jobseeker._id,
                jobId: selectedEmployee.job._id,
                rating,
                comment: reviewComment
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                toast.success('Review submitted successfully!');
                closeRatingModal();
                fetchHiredEmployees(); // Refresh list to show new review
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            toast.error(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        fetchHiredEmployees();
    }, []);

    const fetchHiredEmployees = async () => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.get('http://localhost:5000/api/applications/employer/hired', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setEmployees(response.data.employees);
            }
        } catch (err) {
            console.error('Error fetching hired employees:', err);
            if (err.response?.status === 401) {
                setError('Session expired. Please login again.');
                setTimeout(() => navigate('/'), 2000);
            } else {
                setError('Failed to load hired employees.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmWork = async (app) => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.post(`http://localhost:5000/api/verification/${app._id}/employer-confirm`, {
                status: 'FULL',
                feedback: 'Work completed successfully',
                rating: 5
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success('Work verified successfully!');
                fetchHiredEmployees();
            }
        } catch (err) {
            console.error('Error confirming work:', err);
            toast.error(err.response?.data?.message || 'Failed to verify work');
        }
    };

    const handleMarkAsPaid = async (app) => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.post(`http://localhost:5000/api/applications/${app._id}/mark-paid`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                toast.success('Application marked as paid successfully!');
                fetchHiredEmployees();
            }
        } catch (err) {
            console.error('Error marking paid:', err);
            toast.error(err.response?.data?.message || 'Failed to mark as paid');
        }
    };

    if (loading) {
        return (
            <div className="hired-employees-page">
                <div className="hired-container">
                    <div className="loading-spinner"></div>
                    <p style={{ textAlign: 'center', color: '#666' }}>Loading hired employees...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="hired-employees-page">
            <div className="hired-container">
                <div className="page-header">
                    <button className="back-button" onClick={() => navigate('/employer/dashboard')}>
                        ← Back to Dashboard
                    </button>
                    <h1>Hired Employees</h1>
                    <p>Manage your workforce, track verification, and complete payments</p>
                </div>

                {error && <div className="error-message">{error}</div>}

                {employees.length === 0 ? (
                    <div className="no-employees">
                        <div className="no-data-icon">👥</div>
                        <h2>No Employees Hired Yet</h2>
                        <p>When you accept an application, the employee will appear here.</p>
                        <button className="primary-btn" onClick={() => navigate('/employer/manage-jobs')}>
                            View Active Jobs
                        </button>
                    </div>
                ) : (
                    <div className="employees-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: '30px' }}>
                        {employees.map((app) => {
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                            <span>Employee: <strong>{app.jobseeker?.name || 'Unknown User'}</strong></span>
                                            {app.jobseeker?.stats?.avgRating > 0 && (
                                                <span className="candidate-rating" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#d97706', padding: '2px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
                                                    <span>★</span>
                                                    <span>{app.jobseeker.stats.avgRating.toFixed(1)}</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#78350f', fontWeight: 'normal' }}>({app.jobseeker.stats.ratingCount || 0})</span>
                                                </span>
                                            )}
                                        </div>
                                        <span>Date: <strong>{app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : new Date(app.updatedAt).toLocaleDateString()}</strong></span>
                                    </div>

                                    <div className="hired-card-contact" style={{
                                        display: 'flex',
                                        gap: '20px',
                                        flexWrap: 'wrap',
                                        padding: '8px 16px',
                                        margin: '0 0 10px 0',
                                        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                        borderRadius: '8px',
                                        fontSize: '13.5px',
                                        color: '#334155'
                                    }}>
                                        {app.jobseeker?.email && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '15px' }}>📧</span>
                                                <a href={`mailto:${app.jobseeker.email}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                                                    {app.jobseeker.email}
                                                </a>
                                            </span>
                                        )}
                                        {app.jobseeker?.phone && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '15px' }}>📞</span>
                                                <a href={`tel:${app.jobseeker.phone}`} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
                                                    {app.jobseeker.phone}
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
                                                        📝 Your Rating → {app.jobseeker?.name}: {renderStars(app.review.stars)}
                                                    </button>
                                                    <button className="hired-rating-display received" style={{ width: 'fit-content' }} onClick={() => openViewReviewModal(app, app.receivedReview)}>
                                                        📩 {app.jobseeker?.name}'s Rating → You: {renderStars(app.receivedReview.stars)}
                                                    </button>
                                                </div>
                                            </>
                                        ) : app.employerRated ? (
                                            <span className="hired-btn hired-btn-orange" style={{ opacity: 0.7, cursor: 'default' }}>
                                                <span className="icon">⏳</span> Waiting for Employee Rating
                                            </span>
                                        ) : (
                                            <button className="hired-btn hired-btn-orange" onClick={() => openRatingModal(app)}>
                                                <span className="icon">⭐</span> Rate Employee
                                            </button>
                                        )}

                                        {app.workStatus === 'COMPLETED' || (app.employerConfirmation?.confirmed && app.employeeConfirmation?.confirmed) ? (
                                            <span className="hired-btn hired-btn-success">
                                                <span className="icon">✓</span> Work Verified
                                            </span>
                                        ) : app.employerConfirmation?.confirmed ? (
                                            <span className="hired-btn hired-btn-success" style={{ opacity: 0.7, cursor: 'default' }}>
                                                <span className="icon">⏳</span> Waiting for Employee Confirm
                                            </span>
                                        ) : (
                                            <button className="hired-btn hired-btn-success filled" onClick={() => handleConfirmWork(app)}>
                                                <span className="icon">✓</span> Confirm Work Done
                                            </button>
                                        )}

                                        {!app.isPaid && (
                                            <button className="hired-btn hired-btn-purple" onClick={() => handleMarkAsPaid(app)}>
                                                <span className="icon">💰</span> Mark as Paid
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Rating Modal */}
            {showRatingModal && selectedEmployee && (
                <div className="modal-overlay" onClick={closeRatingModal}>
                    <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={closeRatingModal}>✕</button>
                        <h2>Rate {selectedEmployee.jobseeker?.name}</h2>
                        <p className="job-title-modal">for {selectedEmployee.job?.title}</p>

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
                            placeholder="Share your experience working with this employee..."
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
            {showViewReviewModal && selectedEmployee && selectedReview && (() => {
                const currentUser = JSON.parse(localStorage.getItem('quickhire_user') || '{}');
                const isOwnReview = selectedReview.reviewer === currentUser._id;
                return (
                    <div className="modal-overlay" onClick={closeViewReviewModal}>
                        <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="close-modal" onClick={closeViewReviewModal}>✕</button>
                            <h2>{isOwnReview ? `Your Review for ${selectedEmployee.jobseeker?.name}` : `Review from ${selectedEmployee.jobseeker?.name}`}</h2>
                            <p className="job-title-modal">Job: {selectedEmployee.job?.title}</p>

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
        </div>
    );
};

export default HiredEmployees;
