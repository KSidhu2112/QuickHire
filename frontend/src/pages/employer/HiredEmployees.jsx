import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './HiredEmployees.css';

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
                alert('Review submitted successfully!');
                closeRatingModal();
                fetchHiredEmployees(); // Refresh list to show new review
            }
        } catch (err) {
            console.error('Error submitting review:', err);
            alert(err.response?.data?.message || 'Failed to submit review');
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

    if (loading) {
        return (
            <div className="hired-employees-page">
                <div className="hired-container">
                    <div className="loading-spinner"></div>
                    <p style={{ textAlign: 'center', color: '#fff' }}>Loading hired employees...</p>
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
                    <p>Manage your workforce and track employee performance</p>
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
                    <div className="employees-grid">
                        {employees.map((app) => (
                            <div key={app._id} className="employee-card">
                                <div className="employee-header">
                                    <div className="avatar-placeholder">
                                        {app.jobseeker?.name ? app.jobseeker.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="employee-info">
                                        <h3>{app.jobseeker?.name || 'Unknown User'}</h3>
                                        <span className="job-role">{app.job?.title || 'Unknown Role'}</span>
                                    </div>
                                </div>

                                <div className="employee-details">
                                    <div className="detail-row">
                                        <span className="icon">📧</span>
                                        <a href={`mailto:${app.jobseeker?.email}`}>{app.jobseeker?.email || 'N/A'}</a>
                                    </div>
                                    <div className="detail-row">
                                        <span className="icon">📞</span>
                                        <a href={`tel:${app.jobseeker?.phone}`}>{app.jobseeker?.phone || 'N/A'}</a>
                                    </div>
                                    <div className="detail-row">
                                        <span className="icon">📅</span>
                                        <span>Joined: {new Date(app.reviewedAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="icon">💼</span>
                                        <span>{app.job?.jobType ? app.job.jobType.replace('_', ' ') : 'N/A'}</span>
                                    </div>
                                    {app.review && (
                                        <div className="detail-row review-status">
                                            <span className="icon">⭐</span>
                                            <span style={{ color: '#f39c12', fontWeight: 'bold' }}>{app.review.rating} / 5</span>
                                        </div>
                                    )}
                                </div>

                                <div className="employee-actions">
                                    <button className="action-btn message-btn" onClick={() => window.location.href = `mailto:${app.jobseeker?.email}`}>
                                        Email
                                    </button>
                                    {app.review ? (
                                        <button
                                            className="action-btn view-review-btn"
                                            onClick={() => openViewReviewModal(app, app.review)}
                                            style={{ backgroundColor: '#2ecc71', color: 'white', border: 'none' }}
                                        >
                                            View Review
                                        </button>
                                    ) : (
                                        <button
                                            className="action-btn rate-btn"
                                            onClick={() => openRatingModal(app)}
                                            style={{ backgroundColor: '#f39c12', color: 'white', border: 'none' }}
                                        >
                                            Rate
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
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
            {showViewReviewModal && selectedEmployee && selectedReview && (
                <div className="modal-overlay" onClick={closeViewReviewModal}>
                    <div className="rating-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={closeViewReviewModal}>✕</button>
                        <h2>Review for {selectedEmployee.jobseeker?.name}</h2>
                        <p className="job-title-modal">Job: {selectedEmployee.job?.title}</p>

                        <div className="rating-stars readonly">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                    key={star}
                                    className={`star ${star <= selectedReview.rating ? 'filled' : ''}`}
                                >
                                    ★
                                </span>
                            ))}
                        </div>

                        <div className="review-content">
                            <p>{selectedReview.comment}</p>
                            <span className="review-date">Submitted on: {new Date(selectedReview.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HiredEmployees;
