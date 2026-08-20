import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
import './CompleteProfile.css';

const LANGUAGE_OPTIONS = [
    'Telugu', 'Hindi', 'English', 'Tamil', 'Kannada', 'Malayalam',
    'Marathi', 'Bengali', 'Gujarati', 'Punjabi', 'Urdu', 'Odia'
];

const CATEGORY_OPTIONS = [
    'Driver', 'Delivery Executive', 'Security Guard', 'Housekeeping',
    'Waiter', 'Helper', 'Warehouse Worker', 'Retail Staff', 'Cook',
    'Electrician', 'Plumber', 'Carpenter', 'Painter', 'Mechanic',
    'Gardener', 'Office Boy', 'Receptionist', 'Data Entry', 'Other'
];

const WORK_TYPE_OPTIONS = ['Full-Time', 'Part-Time', 'Daily Wage', 'Contract'];

const CompleteProfile = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
    const [existingProfile, setExistingProfile] = useState(null);

    const [formData, setFormData] = useState({
        // Personal
        city: '',
        state: '',
        pincode: '',
        languages: [],

        // Job Preferences
        preferredCategories: [],
        preferredWorkType: [],
        expectedSalaryMin: '',
        expectedSalaryMax: '',
        salaryPeriod: 'monthly',
        preferredShift: '',
        immediateJoining: false,

        // Skills & Experience
        skills: '',
        yearsOfExperience: 0,
        certifications: '',
        vehicleOwnership: false,

        // Work Experience
        experiences: [{ jobTitle: '', company: '', duration: '', description: '' }],
    });

    const totalSteps = 3;

    useEffect(() => {
        fetchExistingProfile();
    }, []);

    const fetchExistingProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.get(`${API_BASE}/employee-profile/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success && response.data.profile) {
                const p = response.data.profile;
                setExistingProfile(p);
                setFormData({
                    city: p.currentLocation?.city || '',
                    state: p.currentLocation?.state || '',
                    pincode: p.currentLocation?.pincode || '',
                    languages: p.languages || [],
                    preferredCategories: p.preferredCategories || [],
                    preferredWorkType: p.preferredWorkType || [],
                    expectedSalaryMin: p.expectedSalary?.min || '',
                    expectedSalaryMax: p.expectedSalary?.max || '',
                    salaryPeriod: p.expectedSalary?.type_period || 'monthly',
                    preferredShift: p.preferredShift || '',
                    immediateJoining: p.immediateJoining || false,
                    skills: p.skills?.join(', ') || '',
                    yearsOfExperience: p.yearsOfExperience || 0,
                    certifications: p.certifications?.join(', ') || '',
                    vehicleOwnership: p.vehicleOwnership || false,
                    experiences: p.previousWorkExperience?.length > 0
                        ? p.previousWorkExperience
                        : [{ jobTitle: '', company: '', duration: '', description: '' }],
                });
                if (p.profilePhoto) {
                    const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');
                    setProfilePhotoPreview(p.profilePhoto.startsWith('http') ? p.profilePhoto : `${backendUrl}${p.profilePhoto}`);
                }
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleLanguageToggle = (lang) => {
        setFormData(prev => ({
            ...prev,
            languages: prev.languages.includes(lang)
                ? prev.languages.filter(l => l !== lang)
                : [...prev.languages, lang],
        }));
    };

    const handleCategoryToggle = (cat) => {
        setFormData(prev => ({
            ...prev,
            preferredCategories: prev.preferredCategories.includes(cat)
                ? prev.preferredCategories.filter(c => c !== cat)
                : [...prev.preferredCategories, cat],
        }));
    };

    const handleWorkTypeToggle = (type) => {
        setFormData(prev => ({
            ...prev,
            preferredWorkType: prev.preferredWorkType.includes(type)
                ? prev.preferredWorkType.filter(t => t !== type)
                : [...prev.preferredWorkType, type],
        }));
    };

    const handleExperienceChange = (index, field, value) => {
        const updated = [...formData.experiences];
        updated[index] = { ...updated[index], [field]: value };
        setFormData(prev => ({ ...prev, experiences: updated }));
    };

    const addExperience = () => {
        setFormData(prev => ({
            ...prev,
            experiences: [...prev.experiences, { jobTitle: '', company: '', duration: '', description: '' }],
        }));
    };

    const removeExperience = (index) => {
        if (formData.experiences.length === 1) return;
        setFormData(prev => ({
            ...prev,
            experiences: prev.experiences.filter((_, i) => i !== index),
        }));
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => setProfilePhotoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const uploadPhoto = async () => {
        if (!profilePhoto) return existingProfile?.profilePhoto || '';

        try {
            const token = localStorage.getItem('quickhire_token');
            const formDataObj = new FormData();
            formDataObj.append('photo', profilePhoto);

            const response = await axios.post(`${API_BASE}/employee-profile/upload-photo`, formDataObj, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                return response.data.filePath;
            }
        } catch (err) {
            console.error('Photo upload error:', err);
        }
        return '';
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('quickhire_token');

            // Upload photo first
            const photoPath = await uploadPhoto();

            const profileData = {
                profilePhoto: photoPath,
                currentLocation: {
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                },
                languages: formData.languages,
                preferredCategories: formData.preferredCategories,
                preferredWorkType: formData.preferredWorkType,
                expectedSalary: {
                    min: parseInt(formData.expectedSalaryMin) || 0,
                    max: parseInt(formData.expectedSalaryMax) || 0,
                    type_period: formData.salaryPeriod,
                },
                preferredShift: formData.preferredShift,
                immediateJoining: formData.immediateJoining,
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
                yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
                previousWorkExperience: formData.experiences.filter(e => e.jobTitle || e.company),
                certifications: formData.certifications.split(',').map(s => s.trim()).filter(s => s),
                vehicleOwnership: formData.vehicleOwnership,
            };

            const response = await axios.post(`${API_BASE}/employee-profile`, profileData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setSuccess('Profile saved successfully!');

                // Update local storage
                const user = JSON.parse(localStorage.getItem('quickhire_user'));
                if (user) {
                    user.isProfileComplete = response.data.isProfileComplete;
                    localStorage.setItem('quickhire_user', JSON.stringify(user));
                }

                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            }
        } catch (err) {
            console.error('Save profile error:', err);
            setError(err.response?.data?.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const getCompletionPercentage = () => {
        let filled = 0;
        const total = 10;

        if (profilePhotoPreview || existingProfile?.profilePhoto) filled++;
        if (formData.city) filled++;
        if (formData.languages.length > 0) filled++;
        if (formData.preferredCategories.length > 0) filled++;
        if (formData.preferredWorkType.length > 0) filled++;
        if (formData.expectedSalaryMin) filled++;
        if (formData.preferredShift) filled++;
        if (formData.skills) filled++;
        if (formData.yearsOfExperience > 0) filled++;
        if (formData.certifications || formData.experiences.some(e => e.jobTitle)) filled++;

        return Math.round((filled / total) * 100);
    };

    const canProceed = () => {
        if (currentStep === 1) {
            return formData.city && formData.languages.length > 0;
        }
        if (currentStep === 2) {
            return formData.preferredCategories.length > 0 && formData.preferredWorkType.length > 0;
        }
        return true;
    };

    if (loading) {
        return (
            <div className="complete-profile-page">
                <div className="cp-container">
                    <div className="cp-loading">
                        <div className="cp-spinner"></div>
                        <p>Loading your profile...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="complete-profile-page">
            <div className="cp-container">
                {/* Header */}
                <div className="cp-header">
                    <h1>Complete Your Profile</h1>
                    <p>Help us find the best jobs for you</p>
                </div>

                {/* Progress Bar */}
                <div className="cp-progress-section">
                    <div className="cp-progress-bar">
                        <div className="cp-progress-fill" style={{ width: `${getCompletionPercentage()}%` }}></div>
                    </div>
                    <span className="cp-progress-text">{getCompletionPercentage()}% Complete</span>
                </div>

                {/* Step Indicators */}
                <div className="cp-steps">
                    {[
                        { num: 1, label: 'Personal Info', icon: '👤' },
                        { num: 2, label: 'Job Preferences', icon: '💼' },
                        { num: 3, label: 'Skills & Experience', icon: '🎯' },
                    ].map(step => (
                        <div
                            key={step.num}
                            className={`cp-step ${currentStep === step.num ? 'active' : ''} ${currentStep > step.num ? 'completed' : ''}`}
                            onClick={() => step.num < currentStep && setCurrentStep(step.num)}
                        >
                            <div className="cp-step-icon">
                                {currentStep > step.num ? '✓' : step.icon}
                            </div>
                            <span>{step.label}</span>
                        </div>
                    ))}
                </div>

                {error && <div className="cp-error">{error}</div>}
                {success && <div className="cp-success">{success}</div>}

                {/* Step 1: Personal Info */}
                {currentStep === 1 && (
                    <div className="cp-form-section cp-animate-in">
                        <h2>📷 Personal Information</h2>

                        {/* Photo Upload */}
                        <div className="cp-photo-upload">
                            <div className="cp-photo-preview">
                                {profilePhotoPreview ? (
                                    <img src={profilePhotoPreview} alt="Profile" />
                                ) : (
                                    <div className="cp-photo-placeholder">
                                        <span>📷</span>
                                        <p>Add Photo</p>
                                    </div>
                                )}
                            </div>
                            <label className="cp-photo-btn">
                                Choose Photo
                                <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
                            </label>
                        </div>

                        {/* Location */}
                        <h3>📍 Current Location</h3>
                        <div className="cp-form-grid">
                            <div className="cp-form-group">
                                <label>City *</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="e.g. Hyderabad"
                                    required
                                />
                            </div>
                            <div className="cp-form-group">
                                <label>State</label>
                                <input
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="e.g. Telangana"
                                />
                            </div>
                            <div className="cp-form-group">
                                <label>Pincode</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    placeholder="e.g. 500001"
                                />
                            </div>
                        </div>

                        {/* Languages */}
                        <h3>🗣️ Languages Known *</h3>
                        <div className="cp-chip-grid">
                            {LANGUAGE_OPTIONS.map(lang => (
                                <button
                                    key={lang}
                                    type="button"
                                    className={`cp-chip ${formData.languages.includes(lang) ? 'selected' : ''}`}
                                    onClick={() => handleLanguageToggle(lang)}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2: Job Preferences */}
                {currentStep === 2 && (
                    <div className="cp-form-section cp-animate-in">
                        <h2>💼 Job Preferences</h2>

                        {/* Preferred Categories */}
                        <h3>🏷️ Preferred Job Categories *</h3>
                        <p className="cp-hint">Select all that apply</p>
                        <div className="cp-chip-grid categories">
                            {CATEGORY_OPTIONS.map(cat => (
                                <button
                                    key={cat}
                                    type="button"
                                    className={`cp-chip ${formData.preferredCategories.includes(cat) ? 'selected' : ''}`}
                                    onClick={() => handleCategoryToggle(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Work Type */}
                        <h3>⏰ Preferred Work Type *</h3>
                        <div className="cp-chip-grid">
                            {WORK_TYPE_OPTIONS.map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    className={`cp-chip ${formData.preferredWorkType.includes(type) ? 'selected' : ''}`}
                                    onClick={() => handleWorkTypeToggle(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Salary */}
                        <h3>💰 Expected Salary</h3>
                        <div className="cp-form-grid three-col">
                            <div className="cp-form-group">
                                <label>Minimum (₹)</label>
                                <input
                                    type="number"
                                    name="expectedSalaryMin"
                                    value={formData.expectedSalaryMin}
                                    onChange={handleChange}
                                    placeholder="e.g. 10000"
                                />
                            </div>
                            <div className="cp-form-group">
                                <label>Maximum (₹)</label>
                                <input
                                    type="number"
                                    name="expectedSalaryMax"
                                    value={formData.expectedSalaryMax}
                                    onChange={handleChange}
                                    placeholder="e.g. 25000"
                                />
                            </div>
                            <div className="cp-form-group">
                                <label>Period</label>
                                <select name="salaryPeriod" value={formData.salaryPeriod} onChange={handleChange}>
                                    <option value="monthly">Monthly</option>
                                    <option value="daily">Daily</option>
                                    <option value="hourly">Hourly</option>
                                </select>
                            </div>
                        </div>

                        {/* Shift */}
                        <h3>🌙 Preferred Shift</h3>
                        <div className="cp-radio-group">
                            {['Day Shift', 'Night Shift', 'Flexible'].map(shift => (
                                <label key={shift} className={`cp-radio-card ${formData.preferredShift === shift ? 'selected' : ''}`}>
                                    <input
                                        type="radio"
                                        name="preferredShift"
                                        value={shift}
                                        checked={formData.preferredShift === shift}
                                        onChange={handleChange}
                                    />
                                    <span className="cp-radio-icon">
                                        {shift === 'Day Shift' ? '☀️' : shift === 'Night Shift' ? '🌙' : '🔄'}
                                    </span>
                                    <span>{shift}</span>
                                </label>
                            ))}
                        </div>

                        {/* Immediate Joining */}
                        <div className="cp-toggle-row">
                            <span>🚀 Available for Immediate Joining?</span>
                            <label className="cp-toggle-switch">
                                <input
                                    type="checkbox"
                                    name="immediateJoining"
                                    checked={formData.immediateJoining}
                                    onChange={handleChange}
                                />
                                <span className="cp-toggle-slider"></span>
                            </label>
                            <span className={`cp-toggle-label ${formData.immediateJoining ? 'yes' : 'no'}`}>
                                {formData.immediateJoining ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Step 3: Skills & Experience */}
                {currentStep === 3 && (
                    <div className="cp-form-section cp-animate-in">
                        <h2>🎯 Skills & Experience</h2>

                        {/* Skills */}
                        <div className="cp-form-group full-width">
                            <label>Skills (comma separated) *</label>
                            <input
                                type="text"
                                name="skills"
                                value={formData.skills}
                                onChange={handleChange}
                                placeholder="e.g. Driving, Customer Service, Cooking, Cleaning"
                            />
                        </div>

                        {/* Years of Experience */}
                        <div className="cp-form-grid two-col">
                            <div className="cp-form-group">
                                <label>Years of Experience</label>
                                <input
                                    type="number"
                                    name="yearsOfExperience"
                                    value={formData.yearsOfExperience}
                                    onChange={handleChange}
                                    min="0"
                                    max="50"
                                />
                            </div>
                            <div className="cp-form-group">
                                <label>Certifications / Licenses</label>
                                <input
                                    type="text"
                                    name="certifications"
                                    value={formData.certifications}
                                    onChange={handleChange}
                                    placeholder="e.g. Driving License, Food Safety"
                                />
                            </div>
                        </div>

                        {/* Vehicle Ownership */}
                        <div className="cp-toggle-row">
                            <span>🚗 Do you own a vehicle?</span>
                            <label className="cp-toggle-switch">
                                <input
                                    type="checkbox"
                                    name="vehicleOwnership"
                                    checked={formData.vehicleOwnership}
                                    onChange={handleChange}
                                />
                                <span className="cp-toggle-slider"></span>
                            </label>
                            <span className={`cp-toggle-label ${formData.vehicleOwnership ? 'yes' : 'no'}`}>
                                {formData.vehicleOwnership ? 'Yes' : 'No'}
                            </span>
                        </div>

                        {/* Previous Work Experience */}
                        <h3>📝 Previous Work Experience</h3>
                        {formData.experiences.map((exp, index) => (
                            <div key={index} className="cp-experience-card">
                                <div className="cp-exp-header">
                                    <span>Experience #{index + 1}</span>
                                    {formData.experiences.length > 1 && (
                                        <button type="button" className="cp-remove-btn" onClick={() => removeExperience(index)}>
                                            ✕ Remove
                                        </button>
                                    )}
                                </div>
                                <div className="cp-form-grid two-col">
                                    <div className="cp-form-group">
                                        <label>Job Title</label>
                                        <input
                                            type="text"
                                            value={exp.jobTitle}
                                            onChange={(e) => handleExperienceChange(index, 'jobTitle', e.target.value)}
                                            placeholder="e.g. Delivery Boy"
                                        />
                                    </div>
                                    <div className="cp-form-group">
                                        <label>Company</label>
                                        <input
                                            type="text"
                                            value={exp.company}
                                            onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                                            placeholder="e.g. Swiggy"
                                        />
                                    </div>
                                    <div className="cp-form-group">
                                        <label>Duration</label>
                                        <input
                                            type="text"
                                            value={exp.duration}
                                            onChange={(e) => handleExperienceChange(index, 'duration', e.target.value)}
                                            placeholder="e.g. 1 year"
                                        />
                                    </div>
                                    <div className="cp-form-group">
                                        <label>Description</label>
                                        <input
                                            type="text"
                                            value={exp.description}
                                            onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                                            placeholder="Brief description"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button type="button" className="cp-add-exp-btn" onClick={addExperience}>
                            + Add More Experience
                        </button>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="cp-nav-buttons">
                    {currentStep > 1 && (
                        <button type="button" className="cp-btn-secondary" onClick={() => setCurrentStep(prev => prev - 1)}>
                            ← Previous
                        </button>
                    )}

                    <div className="cp-nav-right">
                        {currentStep < totalSteps ? (
                            <button
                                type="button"
                                className="cp-btn-primary"
                                onClick={() => setCurrentStep(prev => prev + 1)}
                                disabled={!canProceed()}
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="cp-btn-submit"
                                onClick={handleSubmit}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="cp-btn-spinner"></span>
                                        Saving...
                                    </>
                                ) : (
                                    '✅ Save & Complete Profile'
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* Skip for now */}
                <div className="cp-skip-section">
                    <button className="cp-skip-btn" onClick={() => navigate('/dashboard')}>
                        Skip for now →
                    </button>
                    <p>You can complete your profile later from the dashboard</p>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfile;
