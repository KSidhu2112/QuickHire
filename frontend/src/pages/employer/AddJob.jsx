import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './AddJob.css';

const AddJob = () => {
    const navigate = useNavigate();
    const [jobType, setJobType] = useState('PART_TIME');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');


    // Common fields
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        company: '',
        category: 'OTHER',
        salaryMin: '',
        salaryMax: '',
        salaryType: 'MONTHLY',
        city: '',
        state: '',
        address: '',
        zipCode: '',
        skills: '',
        experience: 'ANY',
        education: '',
        workersRequired: 1,
        isUrgent: false,
        // Part-time specific
        workingHours: '',
        daysPerWeek: '',
        // Full-time specific
        shift: 'DAY',
        joiningDate: '',
        // Daily job specific
        workDate: '',
        startTime: '',
        endTime: '',
        foodProvided: false,
    });

    // Vacancy specific
    const [vacancyType, setVacancyType] = useState('SINGLE');
    const [autoApprove, setAutoApprove] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Handle logic for interactions between vacancyType and workersRequired
        if (name === 'vacancyType') {
            setVacancyType(value);
            if (value === 'SINGLE') {
                setFormData(prev => ({ ...prev, workersRequired: 1 }));
            } else {
                setFormData(prev => ({ ...prev, workersRequired: 2 }));
            }
            return;
        }

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        let jobData = {};

        try {
            const token = localStorage.getItem('quickhire_token');

            // Prepare job data based on type
            jobData = {
                title: formData.title,
                description: formData.description,
                company: formData.company,
                jobType,
                vacancyType,
                autoApprove: vacancyType === 'BULK' ? autoApprove : false,
                category: formData.category,
                salaryMin: parseFloat(formData.salaryMin),
                salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : parseFloat(formData.salaryMin),
                salaryType: formData.salaryType,
                location: {
                    city: formData.city,
                    state: formData.state,
                    address: formData.address,
                    zipCode: formData.zipCode,
                },
                skills: formData.skills.split(',').map((s) => s.trim()).filter((s) => s),
                experience: formData.experience,
                education: formData.education,
                workersRequired: parseInt(formData.workersRequired),
                isUrgent: formData.isUrgent,
            };

            // Add type-specific fields
            if (jobType === 'PART_TIME' || jobType === 'ON_CALL') {
                jobData.workingHours = formData.workingHours;
                jobData.daysPerWeek = parseInt(formData.daysPerWeek);
            } else if (jobType === 'FULL_TIME' || jobType === 'SHIFT_BASED') {
                jobData.shift = formData.shift;
                if (formData.joiningDate) {
                    jobData.joiningDate = formData.joiningDate;
                }
            } else if (jobType === 'DAILY' || jobType === 'EVENT_BASED') {
                jobData.workDate = formData.workDate;
                jobData.startTime = formData.startTime;
                jobData.endTime = formData.endTime;
                jobData.foodProvided = formData.foodProvided;
            }
            const response = await jobAPI.createJob(jobData);

            if (response.success) {
                navigate('/employer/manage-jobs');
            } else {
                setError('Failed to post job. Please try again.');
            }
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Error posting job:', err);

            // Handle invalid/expired token
            if (err.response?.status === 401) {
                setError('Session expired. Please login again.');
                localStorage.removeItem('quickhire_token');
                localStorage.removeItem('quickhire_user');
                setTimeout(() => {
                    navigate('/');
                }, 2000);
            } else if (err.response?.status === 400 && err.response?.data?.errors) {
                // Display validation errors from backend
                const validationErrors = err.response.data.errors.join('. ');
                setError(`Validation failed: ${validationErrors}`);
            } else if (err.response?.status === 402) {
                // Payment required - save data and navigate to checkout
                localStorage.setItem('pending_job_data', JSON.stringify(jobData));
                toast.info('Payment required to post a job. Redirecting to checkout...');
                navigate('/checkout/post');
            } else {
                setError(err.response?.data?.message || 'Failed to post job');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-job-page">
            <div className="add-job-container">
                <div className="add-job-header">
                    <button className="back-button" onClick={() => navigate('/employer/dashboard')}>
                        ← Back to Dashboard
                    </button>
                    <h1>Add New Job</h1>
                    <p>Post a job opportunity and find the best candidates</p>
                </div>

                {error && <div className="error-alert">{error}</div>}
                {success && <div className="success-alert">{success}</div>}

                {/* Job Type Selector */}
                <div className="job-type-selector">
                    <button
                        className={`type-btn ${jobType === 'PART_TIME' ? 'active' : ''}`}
                        onClick={() => setJobType('PART_TIME')}
                    >
                        <span className="type-icon">⏰</span>
                        <span className="type-label">Part-Time</span>
                    </button>
                    <button
                        className={`type-btn ${jobType === 'FULL_TIME' ? 'active' : ''}`}
                        onClick={() => setJobType('FULL_TIME')}
                    >
                        <span className="type-icon">💼</span>
                        <span className="type-label">Full-Time</span>
                    </button>
                    <button
                        className={`type-btn ${jobType === 'DAILY' ? 'active' : ''}`}
                        onClick={() => setJobType('DAILY')}
                    >
                        <span className="type-icon">📅</span>
                        <span className="type-label">Daily / One-Day</span>
                    </button>
                    <button
                        className={`type-btn ${jobType === 'ON_CALL' ? 'active' : ''}`}
                        onClick={() => setJobType('ON_CALL')}
                    >
                        <span className="type-icon">📞</span>
                        <span className="type-label">On-Call / Emergency</span>
                    </button>
                    <button
                        className={`type-btn ${jobType === 'EVENT_BASED' ? 'active' : ''}`}
                        onClick={() => setJobType('EVENT_BASED')}
                    >
                        <span className="type-icon">🎉</span>
                        <span className="type-label">Event-Based</span>
                    </button>
                    <button
                        className={`type-btn ${jobType === 'SHIFT_BASED' ? 'active' : ''}`}
                        onClick={() => setJobType('SHIFT_BASED')}
                    >
                        <span className="type-icon">🔄</span>
                        <span className="type-label">Shift-Based</span>
                    </button>
                </div>

                <form className="add-job-form" onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <div className="form-section">
                        <h2>Basic Information</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Job Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Restaurant Waiter, Office Helper"
                                    minLength={3}
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Company Name *</label>
                                <input
                                    type="text"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    placeholder="Your company name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Category *</label>
                                <select name="category" value={formData.category} onChange={handleChange} required>
                                    <option value="SHOP">Shop</option>
                                    <option value="RESTAURANT">Restaurant</option>
                                    <option value="OFFICE">Office</option>
                                    <option value="DELIVERY">Delivery</option>
                                    <option value="CATERING">Catering</option>
                                    <option value="EVENT">Event</option>
                                    <option value="HELPER">Helper</option>
                                    <option value="CLEANING">Cleaning</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Vacancy Type *</label>
                                <select
                                    name="vacancyType"
                                    value={vacancyType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="SINGLE">Single Hire (1 Position)</option>
                                    <option value="BULK">Bulk Hire (Multiple Positions)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Number of Workers *</label>
                                <input
                                    type="number"
                                    name="workersRequired"
                                    value={formData.workersRequired}
                                    onChange={handleChange}
                                    min={vacancyType === 'SINGLE' ? "1" : "2"}
                                    max={vacancyType === 'SINGLE' ? "1" : "1000"}
                                    readOnly={vacancyType === 'SINGLE'}
                                    required
                                />
                                {vacancyType === 'SINGLE' && <small className="hint">Locked to 1 for Single Hire</small>}
                            </div>

                            {vacancyType === 'BULK' && (
                                <div className="form-group checkbox-group">
                                    <label className="checkbox-label" title="Automatically accept applicants">
                                        <input
                                            type="checkbox"
                                            checked={autoApprove}
                                            onChange={(e) => setAutoApprove(e.target.checked)}
                                        />
                                        <span>⚡ Enable Auto-Approval</span>
                                    </label>
                                    <small className="hint">Applicants will be instantly hired until vacancies are full.</small>
                                </div>
                            )}

                            <div className="form-group full-width">
                                <label>Job Description *</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe the job responsibilities and requirements..."
                                    rows="4"
                                    minLength={20}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Type-Specific Fields */}
                    {(jobType === 'PART_TIME' || jobType === 'ON_CALL') && (
                        <div className="form-section">
                            <h2>{jobType === 'ON_CALL' ? 'On-Call Details' : 'Part-Time Details'}</h2>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Working Hours *</label>
                                    <input
                                        type="text"
                                        name="workingHours"
                                        value={formData.workingHours}
                                        onChange={handleChange}
                                        placeholder="e.g., 4pm - 9pm"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Days Per Week *</label>
                                    <input
                                        type="number"
                                        name="daysPerWeek"
                                        value={formData.daysPerWeek}
                                        onChange={handleChange}
                                        min="1"
                                        max="7"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Salary Type *</label>
                                    <select name="salaryType" value={formData.salaryType} onChange={handleChange} required>
                                        <option value="DAILY">Per Day</option>
                                        <option value="MONTHLY">Per Month</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {(jobType === 'FULL_TIME' || jobType === 'SHIFT_BASED') && (
                        <div className="form-section">
                            <h2>{jobType === 'SHIFT_BASED' ? 'Shift-Based Details' : 'Full-Time Details'}</h2>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Shift *</label>
                                    <select name="shift" value={formData.shift} onChange={handleChange} required>
                                        <option value="DAY">Day Shift</option>
                                        <option value="NIGHT">Night Shift</option>
                                        <option value="ROTATIONAL">Rotational</option>
                                        <option value="FLEXIBLE">Flexible</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Joining Date</label>
                                    <input
                                        type="date"
                                        name="joiningDate"
                                        value={formData.joiningDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Experience Required *</label>
                                    <select name="experience" value={formData.experience} onChange={handleChange} required>
                                        <option value="ANY">Any</option>
                                        <option value="FRESHER">Fresher</option>
                                        <option value="ENTRY">Entry Level (1-2 years)</option>
                                        <option value="MID">Mid Level (3-5 years)</option>
                                        <option value="SENIOR">Senior (5+ years)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {(jobType === 'DAILY' || jobType === 'EVENT_BASED') && (
                        <div className="form-section">
                            <h2>{jobType === 'EVENT_BASED' ? 'Event Details' : 'Daily Job Details'}</h2>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>{jobType === 'EVENT_BASED' ? 'Event Date *' : 'Work Date *'}</label>
                                    <input
                                        type="date"
                                        name="workDate"
                                        value={formData.workDate}
                                        onChange={handleChange}
                                        min={new Date().toISOString().split('T')[0]}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Start Time *</label>
                                    <input
                                        type="time"
                                        name="startTime"
                                        value={formData.startTime}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>End Time *</label>
                                    <input
                                        type="time"
                                        name="endTime"
                                        value={formData.endTime}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group checkbox-group">
                                    <label className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            name="foodProvided"
                                            checked={formData.foodProvided}
                                            onChange={handleChange}
                                        />
                                        <span>Food Provided</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Salary Information */}
                    <div className="form-section">
                        <h2>Salary Information</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Minimum Salary *</label>
                                <input
                                    type="number"
                                    name="salaryMin"
                                    value={formData.salaryMin}
                                    onChange={handleChange}
                                    placeholder="Enter amount"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Maximum Salary (Optional)</label>
                                <input
                                    type="number"
                                    name="salaryMax"
                                    value={formData.salaryMax}
                                    onChange={handleChange}
                                    placeholder="Enter amount"
                                />
                            </div>

                            {jobType !== 'PART_TIME' && (
                                <div className="form-group">
                                    <label>Salary Type *</label>
                                    <select name="salaryType" value={formData.salaryType} onChange={handleChange} required>
                                        {jobType === 'DAILY' && <option value="DAILY">Per Day</option>}
                                        {jobType === 'FULL_TIME' && <option value="MONTHLY">Per Month</option>}
                                        <option value="FIXED">Fixed</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="form-section">
                        <h2>Location</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>City *</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="e.g., Mumbai"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="e.g., Maharashtra"
                                />
                            </div>

                            <div className="form-group">
                                <label>Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="Full address"
                                />
                            </div>

                            <div className="form-group">
                                <label>Zip Code</label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    value={formData.zipCode}
                                    onChange={handleChange}
                                    placeholder="e.g., 400001"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="form-section">
                        <h2>Additional Information</h2>
                        <div className="form-grid">
                            <div className="form-group full-width">
                                <label>Required Skills (comma separated)</label>
                                <input
                                    type="text"
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    placeholder="e.g., Communication, Customer Service, Time Management"
                                />
                            </div>

                            <div className="form-group">
                                <label>Education</label>
                                <input
                                    type="text"
                                    name="education"
                                    value={formData.education}
                                    onChange={handleChange}
                                    placeholder="e.g., 10th Pass, Graduate"
                                />
                            </div>

                            <div className="form-group checkbox-group">
                                <label className="checkbox-label urgent">
                                    <input
                                        type="checkbox"
                                        name="isUrgent"
                                        checked={formData.isUrgent}
                                        onChange={handleChange}
                                    />
                                    <span>🔥 Mark as Urgent</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={() => navigate('/employer/dashboard')}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Posting...' : 'Post Job'}
                        </button>
                    </div>
                </form>
            </div >
        </div >
    );
};

export default AddJob;
