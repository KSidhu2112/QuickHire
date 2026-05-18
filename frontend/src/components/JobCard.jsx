import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaMoneyBillWave, FaCalendarAlt, FaClock, FaUsers, FaEnvelope, FaPhone } from 'react-icons/fa';
import './JobCard.css';

const JobCard = ({ job, showApplyButton = true, onApply, onCardClick, userRole = 'jobseeker' }) => {
    const navigate = useNavigate();

    const formatSalary = (min, max, type) => {
        if (max && max !== min) {
            return `₹${min.toLocaleString()} - ₹${max.toLocaleString()} ${type}`;
        }
        return `₹${min.toLocaleString()} ${type}`;
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getJobTypeColor = (type) => {
        switch (type) {
            case 'FULL_TIME':
                return 'blue';
            case 'PART_TIME':
                return 'green';
            case 'DAILY':
                return 'orange';
            default:
                return 'gray';
        }
    };

    const getJobTypeLabel = (type) => {
        switch (type) {
            case 'FULL_TIME':
                return 'Full Time';
            case 'PART_TIME':
                return 'Part Time';
            case 'DAILY':
                return 'Daily Job';
            default:
                return type;
        }
    };

    const handleViewDetails = () => {
        if (onCardClick) {
            onCardClick(job);
        } else {
            navigate(`/jobs/${job._id}`);
        }
    };

    const handleApply = (e) => {
        e.stopPropagation();
        if (onApply) {
            onApply(job);
        }
    };

    return (
        <div className="job-card" onClick={handleViewDetails}>
            <div className="job-card-header">
                <div className="job-card-title-section">
                    <h3 className="job-title">{job.title}</h3>
                    <div className="company-rating-wrapper">
                        <p className="job-company">{job.company}</p>
                        {job.employer?.stats?.avgRating > 0 && (
                            <div className="employer-rating-badge">
                                <span className="star">★</span>
                                <span>{job.employer.stats.avgRating.toFixed(1)}</span>
                                <span className="rating-count">({job.employer.stats.ratingCount || 0})</span>
                            </div>
                        )}
                    </div>
                </div>
                <span className={`job-type-badge ${getJobTypeColor(job.jobType)}`}>
                    {getJobTypeLabel(job.jobType)}
                </span>
            </div>

            <div className="job-card-info">
                <div className="job-info-item">
                    <FaMapMarkerAlt className="info-icon location" />
                    <span>{job.location?.city || job.location?.address || (typeof job.location === 'string' ? job.location : 'Location not specified')}</span>
                </div>

                <div className="job-info-item">
                    <FaMoneyBillWave className="info-icon salary" />
                    <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryType)}</span>
                </div>

                {job.jobType === 'DAILY' && job.workDate && (
                    <div className="job-info-item">
                        <FaCalendarAlt className="info-icon date" />
                        <span>{formatDate(job.workDate)}</span>
                    </div>
                )}

                {job.jobType === 'DAILY' && (
                    <div className="job-info-item">
                        <FaClock className="info-icon time" />
                        <span>
                            {job.startTime} - {job.endTime}
                        </span>
                    </div>
                )}

                <div className="job-info-item">
                    <FaUsers className="info-icon vacancies" />
                    <span>
                        Hired: {job.workersHired || 0} / Vacancies: {Math.max(0, job.workersRequired - (job.workersHired || 0))}
                    </span>
                </div>

                {job.showContactInfo && userRole === 'jobseeker' && (
                    <div className="job-contact-details">
                        <div className="job-info-item">
                            <FaEnvelope className="info-icon email" />
                            <span className="contact-label">Email:</span>
                            <a href={`mailto:${job.employer?.email}`} className="contact-value" onClick={(e) => e.stopPropagation()}>{job.employer?.email || 'N/A'}</a>
                        </div>
                        <div className="job-info-item">
                            <FaPhone className="info-icon phone" />
                            <span className="contact-label">Phone:</span>
                            <a href={`tel:${job.contactPhone || job.employer?.phone}`} className="contact-value" onClick={(e) => e.stopPropagation()}>{job.contactPhone || job.employer?.phone || 'N/A'}</a>
                        </div>
                    </div>
                )}
            </div>

            {job.skills && job.skills.length > 0 && (
                <div className="job-skills">
                    {job.skills.slice(0, 3).map((skill, index) => (
                        <span key={index} className="skill-tag">
                            {skill}
                        </span>
                    ))}
                    {job.skills.length > 3 && (
                        <span className="skill-tag more">+{job.skills.length - 3} more</span>
                    )}
                </div>
            )}

            <div className="job-card-footer">
                <div className="job-meta">
                    <span className="job-posted">
                        Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    {job.applicants > 0 && (
                        <span className="job-applicants">{job.applicants} applicants</span>
                    )}
                </div>

                {showApplyButton && userRole === 'jobseeker' && (
                    <button
                        className={`btn-apply ${job.hasApplied ? 'applied' : ''}`}
                        onClick={job.hasApplied || (job.workersHired >= job.workersRequired) ? null : handleApply}
                        disabled={job.hasApplied || (job.workersHired >= job.workersRequired)}
                    >
                        {job.hasApplied
                            ? (job.autoApprove ? 'Joined' : 'Applied')
                            : (job.workersHired >= job.workersRequired
                                ? 'Full'
                                : (job.vacancyType === 'BULK' ? 'Join Job' : 'Apply Now'))}
                    </button>
                )}

                {userRole === 'employer' && (
                    <button className="btn-view" onClick={handleViewDetails}>
                        View Details
                    </button>
                )}
            </div>
        </div>
    );
};

export default JobCard;
