import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');
import { reviewAPI, employeeProfileAPI } from '../../services/api';
import './EmployeeProfile.css';

const renderStars = (rating) => {
    const val = typeof rating === 'number' ? Math.round(rating) : 0;
    if (val === 5) return '⭐⭐⭐⭐⭐';
    if (val === 4) return '⭐⭐⭐⭐☆';
    if (val === 3) return '⭐⭐⭐☆☆';
    if (val === 2) return '⭐⭐☆☆☆';
    if (val === 1) return '⭐☆☆☆☆';
    return '☆☆☆☆☆';
};

const EmployeeProfile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [employeeProfile, setEmployeeProfile] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                skills: user.profile?.skills ? user.profile.skills.join(', ') : '',
                experience: user.profile?.experience || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('quickhire_token');
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);

            const response = await axios.put(`${API_BASE}/auth/profile`, {
                name: formData.name,
                phone: formData.phone,
                profile: {
                    skills: skillsArray,
                    experience: formData.experience
                }
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setUser(response.data.user);
                setEditMode(false);
                localStorage.setItem('quickhire_user', JSON.stringify(response.data.user));
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('quickhire_token');
            const response = await axios.get(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setUser(response.data.user);
                if (response.data.user._id) {
                    fetchReviews(response.data.user._id);
                }
            }

            // Fetch employee profile
            try {
                const profileRes = await employeeProfileAPI.getMyProfile();
                if (profileRes.success && profileRes.profile) {
                    setEmployeeProfile(profileRes.profile);
                }
            } catch (profileErr) {
                console.error('Error fetching employee profile:', profileErr);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            const storedUser = JSON.parse(localStorage.getItem('quickhire_user'));
            if (storedUser) {
                setUser(storedUser);
                if (storedUser._id) {
                    fetchReviews(storedUser._id);
                }
            } else {
                setError('Failed to load profile');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async (userId) => {
        try {
            const data = await reviewAPI.getUserReviews(userId);
            if (data.success) {
                setReviews(data.reviews);
            }
        } catch (err) {
            console.error('Error fetching reviews:', err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('quickhire_token');
        localStorage.removeItem('quickhire_user');
        navigate('/');
    };

    const getTrustScoreColor = (score) => {
        if (score >= 80) return '#38ef7d';
        if (score >= 60) return '#667eea';
        if (score >= 40) return '#f59e0b';
        return '#fc8181';
    };

    const getTrustScoreLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Building';
    };

    if (loading) {
        return (
            <div className="employee-profile-page">
                <div className="profile-container">
                    <div className="loading-spinner"></div>
                    <p style={{ textAlign: 'center', color: '#fff' }}>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="employee-profile-page">
                <div className="profile-container">
                    <div className="error-message">Profile not found. Please login again.</div>
                    <button className="primary-btn" onClick={() => navigate('/')}>Login</button>
                </div>
            </div>
        )
    }

    const trustScore = employeeProfile?.trustScore || user.trustScore || 50;
    const profileCompleteness = employeeProfile?.profileCompleteness || 0;
    const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000');

    return (
        <div className="employee-profile-page">
            <div className="profile-container">
                <div className="page-header">
                    <button className="back-button" onClick={() => navigate('/dashboard')}>
                        ← Back to Dashboard
                    </button>
                    <h1>My Profile</h1>
                    <p>Manage your account settings</p>
                </div>

                {/* Trust Score & Completeness Cards */}
                <div className="profile-stats-row">
                    <div className="profile-stat-card trust-score-card">
                        <div className="trust-score-circle" style={{ borderColor: getTrustScoreColor(trustScore) }}>
                            <span className="trust-score-value" style={{ color: getTrustScoreColor(trustScore) }}>{trustScore}</span>
                        </div>
                        <div>
                            <h4>Trust Score</h4>
                            <span className="trust-label" style={{ color: getTrustScoreColor(trustScore) }}>
                                {getTrustScoreLabel(trustScore)}
                            </span>
                        </div>
                    </div>

                    <div className="profile-stat-card">
                        <div className="completeness-bar-container">
                            <div className="completeness-bar">
                                <div className="completeness-fill" style={{ width: `${profileCompleteness}%`, background: profileCompleteness >= 60 ? 'linear-gradient(90deg, #38ef7d, #11998e)' : 'linear-gradient(90deg, #fc8181, #f56565)' }}></div>
                            </div>
                            <span className="completeness-text">{profileCompleteness}%</span>
                        </div>
                        <h4>Profile Completeness</h4>
                        {profileCompleteness < 60 && (
                            <button className="complete-profile-link" onClick={() => navigate('/employee/complete-profile')}>
                                Complete Profile →
                            </button>
                        )}
                    </div>

                    <div className="profile-stat-card">
                        <span className="stat-big-number">{user.stats?.jobsCompleted || 0}</span>
                        <h4>Jobs Completed</h4>
                    </div>

                    <div className="profile-stat-card">
                        <span className="stat-big-number">{user.stats?.avgRating ? user.stats.avgRating.toFixed(1) : '0.0'} ⭐</span>
                        <h4>Average Rating</h4>
                    </div>
                </div>

                <div className="profile-card">
                    <div className="profile-header-section">
                        <div className="profile-avatar">
                            {employeeProfile?.profilePhoto ? (
                                <img
                                    src={employeeProfile.profilePhoto.startsWith('http') ? employeeProfile.profilePhoto : `${backendUrl}${employeeProfile.profilePhoto}`}
                                    alt="Profile"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                                />
                            ) : (
                                user.name ? user.name.charAt(0).toUpperCase() : 'U'
                            )}
                        </div>
                        <div className="profile-title">
                            <h2>{editMode ? 'Edit Profile' : user.name}</h2>
                            <span className="role-badge">Job Seeker</span>
                        </div>
                    </div>

                    {editMode ? (
                        <div className="profile-form-grid">
                            <div className="form-group">
                                <label>Name</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} className="profile-input" />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="profile-input" />
                            </div>
                            <div className="form-group">
                                <label>Skills (comma separated)</label>
                                <input type="text" name="skills" value={formData.skills} onChange={handleChange} className="profile-input" placeholder="e.g. Driving, Cooking" />
                            </div>
                            <div className="form-group">
                                <label>Experience (years)</label>
                                <input type="text" name="experience" value={formData.experience} onChange={handleChange} className="profile-input" />
                            </div>
                            <div className="form-actions" style={{ gridColumn: '1 / -1', display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button className="primary-btn" onClick={handleSave}>Save Changes</button>
                                <button className="cancel-btn" onClick={() => {
                                    setEditMode(false);
                                    if (user) {
                                        setFormData({
                                            name: user.name || '',
                                            phone: user.phone || '',
                                            skills: user.profile?.skills ? user.profile.skills.join(', ') : '',
                                            experience: user.profile?.experience || '',
                                        });
                                    }
                                }}>Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="profile-details-grid">
                                <div className="detail-group">
                                    <label>Email Address</label>
                                    <div className="detail-value">{user.email}</div>
                                </div>
                                <div className="detail-group">
                                    <label>Phone Number</label>
                                    <div className="detail-value">{user.phone || 'Not provided'}</div>
                                </div>
                                <div className="detail-group">
                                    <label>Skills</label>
                                    <div className="detail-value">
                                        {employeeProfile?.skills?.length > 0
                                            ? employeeProfile.skills.join(', ')
                                            : user.profile?.skills?.length > 0
                                                ? user.profile.skills.join(', ')
                                                : 'No skills listed'}
                                    </div>
                                </div>
                                <div className="detail-group">
                                    <label>Experience</label>
                                    <div className="detail-value">
                                        {employeeProfile?.yearsOfExperience
                                            ? `${employeeProfile.yearsOfExperience} years`
                                            : user.profile?.experience || 'Not provided'}
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Profile Info */}
                            {employeeProfile && (
                                <div className="enhanced-profile-section">
                                    <h3>📋 Profile Details</h3>
                                    <div className="profile-details-grid">
                                        {employeeProfile.currentLocation?.city && (
                                            <div className="detail-group">
                                                <label>📍 Location</label>
                                                <div className="detail-value">
                                                    {employeeProfile.currentLocation.city}
                                                    {employeeProfile.currentLocation.state && `, ${employeeProfile.currentLocation.state}`}
                                                </div>
                                            </div>
                                        )}
                                        {employeeProfile.languages?.length > 0 && (
                                            <div className="detail-group">
                                                <label>🗣️ Languages</label>
                                                <div className="detail-value">{employeeProfile.languages.join(', ')}</div>
                                            </div>
                                        )}
                                        {employeeProfile.preferredCategories?.length > 0 && (
                                            <div className="detail-group">
                                                <label>💼 Preferred Jobs</label>
                                                <div className="detail-value">{employeeProfile.preferredCategories.join(', ')}</div>
                                            </div>
                                        )}
                                        {employeeProfile.preferredWorkType?.length > 0 && (
                                            <div className="detail-group">
                                                <label>⏰ Work Type</label>
                                                <div className="detail-value">{employeeProfile.preferredWorkType.join(', ')}</div>
                                            </div>
                                        )}
                                        {employeeProfile.preferredShift && (
                                            <div className="detail-group">
                                                <label>🌙 Shift Preference</label>
                                                <div className="detail-value">{employeeProfile.preferredShift}</div>
                                            </div>
                                        )}
                                        <div className="detail-group">
                                            <label>🚀 Immediate Joining</label>
                                            <div className="detail-value">{employeeProfile.immediateJoining ? 'Yes' : 'No'}</div>
                                        </div>
                                        <div className="detail-group">
                                            <label>🚗 Vehicle Ownership</label>
                                            <div className="detail-value">{employeeProfile.vehicleOwnership ? 'Yes' : 'No'}</div>
                                        </div>
                                        {employeeProfile.certifications?.length > 0 && (
                                            <div className="detail-group">
                                                <label>📜 Certifications</label>
                                                <div className="detail-value">{employeeProfile.certifications.join(', ')}</div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Granular Ratings */}
                                    {employeeProfile.totalRatingsCount > 0 && (
                                        <div className="granular-ratings">
                                            <h3>📊 Detailed Ratings</h3>
                                            <div className="ratings-grid">
                                                {[
                                                    { label: 'Work Quality', data: employeeProfile.ratings?.workQuality },
                                                    { label: 'Punctuality', data: employeeProfile.ratings?.punctuality },
                                                    { label: 'Reliability', data: employeeProfile.ratings?.reliability },
                                                    { label: 'Behavior', data: employeeProfile.ratings?.behavior },
                                                    { label: 'Communication', data: employeeProfile.ratings?.communication },
                                                ].map(r => (
                                                    <div key={r.label} className="rating-item">
                                                        <span className="rating-label">{r.label}</span>
                                                        <div className="rating-bar-bg">
                                                            <div
                                                                className="rating-bar-fill"
                                                                style={{ width: `${r.data?.count > 0 ? (r.data.total / r.data.count / 5) * 100 : 0}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="rating-num">
                                                            {r.data?.count > 0 ? (r.data.total / r.data.count).toFixed(1) : '—'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {!editMode && (
                        <>
                            <div className="reviews-section">
                                <h3>Reviews ({reviews.length})</h3>
                                {reviews.length === 0 ? (
                                    <p className="no-reviews">No reviews yet.</p>
                                ) : (
                                    <div className="reviews-list">
                                        {reviews.map((review) => (
                                            <div key={review._id} className="review-card">
                                                <div className="review-header">
                                                    <span className="reviewer-name">{review.reviewer?.name || 'Anonymous'}</span>
                                                    <span className="review-date">{new Date(review.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="review-rating">
                                                    {renderStars(review.stars)}
                                                </div>
                                                <p className="review-job">Job: {review.job?.title}</p>
                                                <p className="review-comment">{review.feedback}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="profile-actions">
                                <button className="edit-btn" onClick={() => setEditMode(true)}>
                                    Edit Profile
                                </button>
                                <button className="edit-btn" onClick={() => navigate('/employee/complete-profile')} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                                    Update Full Profile
                                </button>
                                <button className="logout-btn" onClick={handleLogout}>
                                    Logout
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeProfile;
