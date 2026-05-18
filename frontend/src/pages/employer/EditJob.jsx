import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './AddJob.css';

const EditJob = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [jobType, setJobType] = useState('PART_TIME');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

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
        workingHours: '',
        daysPerWeek: '',
        shift: 'DAY',
        joiningDate: '',
        workDate: '',
        startTime: '',
        endTime: '',
        foodProvided: false,
        accommodation: false,
        immediateJoining: false,
        deadline: '',
        showContactInfo: true,
        contactPhone: '',
    });

    const [vacancyType, setVacancyType] = useState('SINGLE');
    const [autoApprove, setAutoApprove] = useState(false);

    useEffect(() => {
        fetchJobDetails();
    }, [id]);

    const fetchJobDetails = async () => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.get(`http://localhost:5000/api/jobs/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                const job = response.data.job;
                setJobType(job.jobType);
                setVacancyType(job.vacancyType || (job.workersRequired > 1 ? 'BULK' : 'SINGLE'));
                setAutoApprove(job.autoApprove || false);

                setFormData({
                    title: job.title || '',
                    description: job.description || '',
                    company: job.company || '',
                    category: job.category || 'OTHER',
                    salaryMin: job.salaryMin || '',
                    salaryMax: job.salaryMax || '',
                    salaryType: job.salaryType || 'MONTHLY',
                    city: job.location?.city || '',
                    state: job.location?.state || '',
                    address: job.location?.address || '',
                    zipCode: job.location?.zipCode || '',
                    skills: job.skills ? job.skills.join(', ') : '',
                    experience: job.experience || 'ANY',
                    education: job.education || '',
                    workersRequired: job.workersRequired || 1,
                    isUrgent: job.isUrgent || false,
                    workingHours: job.workingHours || '',
                    daysPerWeek: job.daysPerWeek || '',
                    shift: job.shift || 'DAY',
                    joiningDate: job.joiningDate ? new Date(job.joiningDate).toISOString().split('T')[0] : '',
                    workDate: job.workDate ? new Date(job.workDate).toISOString().split('T')[0] : '',
                    startTime: job.startTime || '',
                    endTime: job.endTime || '',
                    foodProvided: job.foodProvided || false,
                    accommodation: job.accommodation || false,
                    immediateJoining: job.immediateJoining || false,
                    deadline: job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '',
                    showContactInfo: job.showContactInfo !== undefined ? job.showContactInfo : true,
                    contactPhone: job.contactPhone || '',
                });
            }
        } catch (err) {
            console.error('Error fetching job details:', err);
            setError('Failed to fetch job details');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'vacancyType') {
            setVacancyType(value);
            if (value === 'SINGLE') {
                setFormData(prev => ({ ...prev, workersRequired: 1 }));
            } else if (formData.workersRequired === 1) {
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
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('quickhire_token');

            const jobData = {
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
                accommodation: formData.accommodation,
                immediateJoining: formData.immediateJoining,
                deadline: formData.deadline,
                joiningDate: formData.joiningDate,
                showContactInfo: !!formData.contactPhone,
                contactPhone: formData.contactPhone,
            };

            if (jobType === 'PART_TIME' || jobType === 'ON_CALL') {
                jobData.workingHours = formData.workingHours;
                jobData.daysPerWeek = parseInt(formData.daysPerWeek);
            } else if (jobType === 'FULL_TIME' || jobType === 'SHIFT_BASED') {
                jobData.shift = formData.shift;
            } else if (jobType === 'DAILY' || jobType === 'EVENT_BASED') {
                jobData.workDate = formData.workDate;
                jobData.startTime = formData.startTime;
                jobData.endTime = formData.endTime;
                jobData.foodProvided = formData.foodProvided;
            }

            const response = await axios.put(`http://localhost:5000/api/jobs/${id}`, jobData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setSuccess('Job updated successfully!');
                setTimeout(() => navigate('/employer/manage-jobs'), 1500);
            }
        } catch (err) {
            console.error('Error updating job:', err);
            setError(err.response?.data?.message || 'Failed to update job');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="add-job-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading job details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="add-job-page">
            <div className="add-job-container">
                <div className="add-job-header">
                    <button className="back-button" onClick={() => navigate('/employer/manage-jobs')}>
                        ← Back to Manage Jobs
                    </button>
                    <h1>Edit Job</h1>
                    <p>Update your job posting information</p>
                </div>

                {error && <div className="error-alert">{error}</div>}
                {success && <div className="success-alert">{success}</div>}

                {/* Job Type Selector (Read-only during edit for data consistency) */}
                <div className="job-type-selector disabled" style={{ opacity: 0.7, pointerEvents: 'none' }}>
                    <button className={`type-btn ${jobType === 'PART_TIME' ? 'active' : ''}`}>
                        <span className="type-icon">⏰</span>
                        <span className="type-label">Part-Time</span>
                    </button>
                    <button className={`type-btn ${jobType === 'FULL_TIME' ? 'active' : ''}`}>
                        <span className="type-icon">💼</span>
                        <span className="type-label">Full-Time</span>
                    </button>
                    <button className={`type-btn ${jobType === 'DAILY' ? 'active' : ''}`}>
                        <span className="type-icon">📅</span>
                        <span className="type-label">Daily</span>
                    </button>
                    <button className={`type-btn ${jobType === 'ON_CALL' ? 'active' : ''}`}>
                        <span className="type-icon">📞</span>
                        <span className="type-label">On-Call</span>
                    </button>
                </div>

                <form className="add-job-form" onSubmit={handleSubmit}>
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
                                <select name="vacancyType" value={vacancyType} onChange={handleChange} required>
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
                                    readOnly={vacancyType === 'SINGLE'}
                                    required
                                />
                            </div>

                            <div className="form-group full-width">
                                <label>Job Description *</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Type-Specific Fields */}
                    {(jobType === 'PART_TIME' || jobType === 'ON_CALL') && (
                        <div className="form-section">
                            <h2>Part-Time / On-Call Details</h2>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Working Hours *</label>
                                    <input type="text" name="workingHours" value={formData.workingHours} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Days Per Week *</label>
                                    <input type="number" name="daysPerWeek" value={formData.daysPerWeek} onChange={handleChange} min="1" max="7" required />
                                </div>
                            </div>
                        </div>
                    )}

                    {(jobType === 'FULL_TIME' || jobType === 'SHIFT_BASED') && (
                        <div className="form-section">
                            <h2>Shift Details</h2>
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
                            </div>
                        </div>
                    )}

                    {(jobType === 'DAILY' || jobType === 'EVENT_BASED') && (
                        <div className="form-section">
                            <h2>Work Date & Time</h2>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Work Date *</label>
                                    <input type="date" name="workDate" value={formData.workDate} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Start Time *</label>
                                    <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
                                </div>
                                <div className="form-group">
                                    <label>End Time *</label>
                                    <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="form-section">
                        <h2>Salary & Location</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Min Salary</label>
                                <input type="number" name="salaryMin" value={formData.salaryMin} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Max Salary</label>
                                <input type="number" name="salaryMax" value={formData.salaryMax} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>City *</label>
                                <input type="text" name="city" value={formData.city} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Joining Date</label>
                                <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                                <label>Deadline</label>
                                <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>Features</h2>
                        <div className="form-group checkbox-group-row">
                            <label className="checkbox-label">
                                <input type="checkbox" name="accommodation" checked={formData.accommodation} onChange={handleChange} />
                                <span>🏠 Accommodation</span>
                            </label>
                            <label className="checkbox-label">
                                <input type="checkbox" name="immediateJoining" checked={formData.immediateJoining} onChange={handleChange} />
                                <span>🚀 Immediate</span>
                            </label>
                            <label className="checkbox-label urgent">
                                <input type="checkbox" name="isUrgent" checked={formData.isUrgent} onChange={handleChange} />
                                <span>🔥 Urgent</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={() => navigate('/employer/manage-jobs')}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn" disabled={saving}>
                            {saving ? 'Saving...' : 'Update Job'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditJob;
