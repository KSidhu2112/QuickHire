import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI, applicationAPI, authAPI } from '../../services/api';
import JobCard from '../../components/JobCard';
import JobFilters from '../../components/JobFilters';
import { toast } from 'react-toastify';
import './EmployeeDashboard.css';

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('all');
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({});
    const [user, setUser] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showJobModal, setShowJobModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        // Check if user is logged in and is a jobseeker
        const storedUser = authAPI.getStoredUser();
        if (!storedUser || storedUser.role !== 'jobseeker') {
            navigate('/login');
            return;
        }
        setUser(storedUser);
        fetchJobs();
    }, [activeTab, filters, debouncedSearch]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const queryFilters = {
                ...filters,
                status: 'ACTIVE',
                keyword: debouncedSearch
            };

            if (activeTab !== 'all') {
                queryFilters.jobType = activeTab.toUpperCase();
            }

            const response = await jobAPI.getJobs(queryFilters);
            // Filter out applied jobs
            const filteredJobs = (response.jobs || []).filter(job => !job.hasApplied);
            setJobs(filteredJobs);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = async (job) => {
        try {
            await applicationAPI.applyForJob(job._id, {
                coverLetter: '',
                availability: 'Immediate',
            });
            toast.success('Application submitted successfully!');
            fetchJobs(); // Refresh to update applicant count
            if (showJobModal) closeJobModal();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to apply';
            toast.error(errorMsg);
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

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    const getTabTitle = (tab) => {
        switch (tab) {
            case 'all':
                return 'All Jobs';
            case 'part_time':
                return 'Part-Time Jobs';
            case 'full_time':
                return 'Full-Time Jobs';
            case 'daily':
                return 'Daily Jobs';
            case 'on_call':
                return 'On-Call / Emergency Jobs';
            case 'event_based':
                return 'Event-Based Jobs';
            case 'shift_based':
                return 'Shift-Based Jobs';
            default:
                return 'Jobs';
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

    return (
        <div className="employee-dashboard">
            <div className="dashboard-header">
                <div className="dashboard-title-section">
                    <h1>Find Your Next Opportunity</h1>
                    <p>Browse and apply for jobs that match your skills</p>

                    <div className="search-bar-container">
                        <i className="search-icon">🔍</i>
                        <input
                            type="text"
                            className="job-search-input"
                            placeholder="Search for jobs (e.g. Catering, Restaurant, DMart)..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                if (e.target.value) setActiveTab('all');
                            }}
                        />
                    </div>
                </div>
                <div className="dashboard-actions">
                    <button
                        className="btn-my-applications"
                        onClick={() => navigate('/employee/applications')}
                        style={{ marginRight: '10px' }}
                    >
                        My Applications
                    </button>
                    <button
                        className="btn-my-applications"
                        onClick={() => navigate('/employee/shortlisted')}
                        style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                    >
                        Shortlisted Jobs
                    </button>
                </div>
            </div>

            <div className="dashboard-tabs">
                <button
                    className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Jobs
                </button>
                <button
                    className={`tab ${activeTab === 'part_time' ? 'active' : ''}`}
                    onClick={() => setActiveTab('part_time')}
                >
                    Part-Time
                </button>
                <button
                    className={`tab ${activeTab === 'full_time' ? 'active' : ''}`}
                    onClick={() => setActiveTab('full_time')}
                >
                    Full-Time
                </button>
                <button
                    className={`tab ${activeTab === 'daily' ? 'active' : ''}`}
                    onClick={() => setActiveTab('daily')}
                >
                    Daily Jobs
                </button>
                <button
                    className={`tab ${activeTab === 'on_call' ? 'active' : ''}`}
                    onClick={() => setActiveTab('on_call')}
                >
                    On-Call
                </button>
                <button
                    className={`tab ${activeTab === 'event_based' ? 'active' : ''}`}
                    onClick={() => setActiveTab('event_based')}
                >
                    Event-Based
                </button>
                <button
                    className={`tab ${activeTab === 'shift_based' ? 'active' : ''}`}
                    onClick={() => setActiveTab('shift_based')}
                >
                    Shift-Based
                </button>
            </div>

            <div className="dashboard-content">
                <aside className="dashboard-sidebar">
                    <JobFilters
                        onFilterChange={handleFilterChange}
                        jobType={activeTab.toUpperCase()}
                    />
                </aside>

                <main className="dashboard-main">
                    <div className="jobs-header">
                        <h2>{getTabTitle(activeTab)}</h2>
                        <p className="jobs-count">
                            {loading ? 'Loading...' : `${jobs.length} jobs found`}
                        </p>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="loader"></div>
                            <p>Loading jobs...</p>
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📭</div>
                            <h3>No jobs found</h3>
                            <p>Try adjusting your filters or check back later for new opportunities</p>
                        </div>
                    ) : (
                        <div className="jobs-grid">
                            {jobs.map((job) => (
                                <JobCard
                                    key={job._id}
                                    job={job}
                                    onApply={handleApply}
                                    onCardClick={handleJobClick}
                                    userRole="jobseeker"
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* Job Details Modal */}
            {showJobModal && selectedJob && (
                <div className="modal-overlay" onClick={closeJobModal}>
                    <div className="job-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={closeJobModal}>✕</button>

                        <div className="modal-header">
                            <h2>{selectedJob.title}</h2>
                            <p className="company-name">{selectedJob.company}</p>
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
                                                selectedJob.location.address,
                                                selectedJob.location.city,
                                                selectedJob.location.state,
                                                selectedJob.location.zipCode
                                            ].filter(Boolean).join(', ') || 'Location not available'}
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
                                className={`btn-primary ${selectedJob.hasApplied ? 'applied' : ''}`}
                                onClick={() => !selectedJob.hasApplied && selectedJob.workersHired < selectedJob.workersRequired && handleApply(selectedJob)}
                                disabled={selectedJob.hasApplied || selectedJob.workersHired >= selectedJob.workersRequired}
                            >
                                {selectedJob.hasApplied
                                    ? (selectedJob.autoApprove ? 'Joined' : 'Applied')
                                    : (selectedJob.workersHired >= selectedJob.workersRequired
                                        ? 'Full'
                                        : (selectedJob.vacancyType === 'BULK' ? 'Join Job' : 'Apply Now'))}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;
