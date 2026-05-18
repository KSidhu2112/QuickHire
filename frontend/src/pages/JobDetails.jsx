import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobAPI, applicationAPI, authAPI, paymentAPI } from '../services/api';
import { toast } from 'react-toastify';
import { startMonetizationPayment } from '../utils/paymentHandler';
import './JobDetails.css';

import TrustApplyModal from '../components/TrustApplyModal';
import PaymentModal from '../components/PaymentModal';

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [sharePhone, setSharePhone] = useState(true);
    const [isApplying, setIsApplying] = useState(false);
    const [showTrustModal, setShowTrustModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    useEffect(() => {
        const storedUser = authAPI.getStoredUser();
        setUser(storedUser);
        fetchJobDetails();
    }, [id]);

    const fetchJobDetails = async () => {
        setLoading(true);
        try {
            const response = await jobAPI.getJobById(id);
            if (response.success) {
                setJob(response.job);
            } else {
                toast.error('Job not found');
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error fetching job details:', error);
            toast.error('Failed to load job details');
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async () => {
        if (!user) {
            toast.info('Please log in to apply');
            navigate('/login');
            return;
        }

        if (user.role !== 'jobseeker') {
            toast.error('Only job seekers can apply for jobs');
            return;
        }

        try {
            setIsApplying(true);
            // Check if already paid
            const status = await paymentAPI.checkStatus('apply', id);

            if (status.paid) {
                setShowTrustModal(true);
            } else {
                setShowPaymentModal(true);
            }
        } catch (error) {
            toast.error('Failed to check payment status');
        } finally {
            setIsApplying(false);
        }
    };

    const handlePaymentSuccess = () => {
        toast.success('Payment successful! You can now apply.');
        setShowTrustModal(true);
    };

    const handleConfirmApply = async (trustDetails) => {
        setIsApplying(true);
        try {
            await applicationAPI.applyForJob(job._id, {
                coverLetter: '',
                availability: 'Immediate',
                shareContactInfo: sharePhone,
                trustDetails: trustDetails
            });
            toast.success('Application submitted successfully!');
            setShowTrustModal(false);
            fetchJobDetails(); // Refresh to update status
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to apply';
            toast.error(errorMsg);
        } finally {
            setIsApplying(false);
        }
    };

    const getGoogleMapsUrl = (location) => {
        if (!location) return '';
        const addressParts = [
            location.address,
            location.city,
            location.state,
            location.zipCode
        ].filter(Boolean);
        const query = encodeURIComponent(addressParts.join(', '));
        return `https://www.google.com/maps/search/?api=1&query=${query}`;
    };

    if (loading) {
        return (
            <div className="job-details-page">
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>Loading job details...</p>
                </div>
            </div>
        );
    }

    if (!job) return null;

    return (
        <div className="job-details-page">
            <div className="job-details-container">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    ← Back
                </button>

                <div className="job-header-card">
                    <div className="job-header-main">
                        <div>
                            <h1 className="job-title-large">{job.title}</h1>
                            <p className="company-name-large">{job.company}</p>
                        </div>
                        <div className="job-status-badge">
                            <span className={`status-tag ${job.status?.toLowerCase()}`}>
                                {job.status}
                            </span>
                        </div>
                    </div>

                    <div className="job-meta-grid">
                        <div className="meta-item">
                            <span className="icon">📍</span>
                            <span>{job.location?.city || 'Remote'}</span>
                        </div>
                        <div className="meta-item">
                            <span className="icon">💰</span>
                            <span>₹{job.salaryMin} - ₹{job.salaryMax} ({job.salaryType})</span>
                        </div>
                        <div className="meta-item">
                            <span className="icon">⏰</span>
                            <span>{job.jobType?.replace('_', ' ')}</span>
                        </div>
                        <div className="meta-item">
                            <span className="icon">📅</span>
                            <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>

                        {job.joiningDate && (
                            <div className="meta-item">
                                <span className="icon">🚀</span>
                                <span>Joining: {new Date(job.joiningDate).toLocaleDateString()}</span>
                            </div>
                        )}
                        {job.deadline && (
                            <div className="meta-item">
                                <span className="icon">⌛</span>
                                <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                            </div>
                        )}
                        {job.accommodation && (
                            <div className="meta-item">
                                <span className="icon">🏠</span>
                                <span>Accommodation Provided</span>
                            </div>
                        )}
                        {job.immediateJoining && (
                            <div className="meta-item">
                                <span className="icon">⚡</span>
                                <span>Immediate Joining</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="job-content-grid">
                    <div className="main-content">
                        <section className="detail-section">
                            <h2>Description</h2>
                            <p className="description-text">{job.description}</p>
                        </section>

                        <section className="detail-section">
                            <h2>Requirements & Skills</h2>
                            <div className="skills-container ml-0">
                                {job.skills?.map((skill, index) => (
                                    <span key={index} className="skill-pill">{skill}</span>
                                ))}
                            </div>
                            {job.experience && (
                                <p className="experience-req">
                                    <strong>Experience Required:</strong> {job.experience}
                                </p>
                            )}
                        </section>

                        {job.jobType === 'DAILY' && (
                            <section className="detail-section">
                                <h2>Schedule</h2>
                                <div className="schedule-info">
                                    <p><strong>Date:</strong> {new Date(job.workDate).toLocaleDateString()}</p>
                                    <p><strong>Time:</strong> {job.startTime} - {job.endTime}</p>
                                </div>
                            </section>
                        )}
                    </div>

                    <aside className="sidebar-content">
                        {/* Employer Contact Card */}
                        {job.employer && job.showContactInfo !== false && (
                            <div className="employer-card">
                                <h3>Contact Employer</h3>
                                <div className="employer-info">
                                    <p className="emp-name">👤 {job.employer.name}</p>
                                    {job.employer.email && (
                                        <p><a href={`mailto:${job.employer.email}`}>📧 {job.employer.email}</a></p>
                                    )}
                                    {(job.contactPhone || job.employer.phone) && (
                                        <div className="phone-contact">
                                            <p>📞 {job.contactPhone || job.employer.phone}</p>
                                            <div className="action-buttons-row">
                                                <a href={`tel:${job.contactPhone || job.employer.phone}`} className="btn-call">
                                                    Call
                                                </a>
                                                <a
                                                    href={`https://wa.me/${(job.contactPhone || job.employer.phone).replace(/[^0-9]/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-whatsapp"
                                                >
                                                    WhatsApp
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Location Card */}
                        <div className="location-card">
                            <h3>Location</h3>
                            <p>{[
                                job.location?.address,
                                job.location?.city,
                                job.location?.state,
                                job.location?.zipCode
                            ].filter(Boolean).join(', ')}</p>

                            <a
                                href={getGoogleMapsUrl(job.location)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-map"
                            >
                                View on Google Maps ↗
                            </a>
                        </div>

                        {/* Apply Action Card */}
                        <div className="action-card">
                            <div className="hiring-status">
                                <p><strong>Vacancies:</strong> {job.workersRequired}</p>
                                <p><strong>Hired:</strong> {job.workersHired}</p>
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${Math.min((job.workersHired / job.workersRequired) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {user?.role === 'jobseeker' && !job.hasApplied && (
                                <div className="apply-confirmation">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={sharePhone}
                                            onChange={(e) => setSharePhone(e.target.checked)}
                                        />
                                        Share my phone number
                                    </label>
                                </div>
                            )}

                            {user?.role === 'jobseeker' ? (
                                <button
                                    className={`btn-apply-large ${job.hasApplied ? 'applied' : ''}`}
                                    onClick={handleApply}
                                    disabled={job.hasApplied || job.workersHired >= job.workersRequired || isApplying}
                                >
                                    {job.hasApplied
                                        ? (job.autoApprove ? 'Joined ✓' : 'Applied ✓')
                                        : (job.workersHired >= job.workersRequired
                                            ? 'Positions Filled'
                                            : (isApplying ? 'Processing...' : 'Pay & Apply (₹10)'))}
                                </button>
                            ) : user?.role === 'employer' && user._id === job.employer._id ? (
                                <button
                                    className="btn-edit-job"
                                    onClick={() => navigate('/employer/manage-jobs')}
                                >
                                    Manage Job
                                </button>
                            ) : null}
                        </div>
                    </aside>
                </div>
            </div>

            <TrustApplyModal
                isOpen={showTrustModal}
                onClose={() => setShowTrustModal(false)}
                onApply={handleConfirmApply}
                isApplying={isApplying}
            />

            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={handlePaymentSuccess}
                amount={10}
                action="apply"
                jobId={id}
            />
        </div >
    );
};

export default JobDetails;
