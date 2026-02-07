import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applicationAPI, authAPI } from '../../services/api';
import JobCard from '../../components/JobCard';
import { toast } from 'react-toastify';
import './EmployeeDashboard.css'; // Reusing dashboard styles

const ShortlistedJobs = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showJobModal, setShowJobModal] = useState(false);

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
            // Fetch applications with status 'ACCEPTED' (which implies Shortlisted based on backend logic)
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
        // Handle if location is a string or object (based on previous fixes)
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
                        <div className="jobs-grid">
                            {applications.map((app) => (
                                <JobCard
                                    key={app._id}
                                    job={app.job}
                                    userRole="jobseeker"
                                    showApplyButton={false} // Hide apply button as they already applied
                                    onCardClick={handleJobClick}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

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
                                    // Maybe navigate to chat or show contact info?
                                    // For now just close or maybe show "Contact Employer"
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
