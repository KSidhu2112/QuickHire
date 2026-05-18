import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { reviewAPI } from '../../services/api';
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

            const response = await axios.put('http://localhost:5000/api/auth/profile', {
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
                // Update local storage just in case
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
            // Try fetching from 'me' endpoint or use local storage
            const response = await axios.get('http://localhost:5000/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setUser(response.data.user);
                if (response.data.user._id) {
                    fetchReviews(response.data.user._id);
                }
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            // Fallback to local storage
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

                <div className="profile-card">
                    <div className="profile-header-section">
                        <div className="profile-avatar">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
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
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="profile-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="profile-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Skills (comma separated)</label>
                                <input
                                    type="text"
                                    name="skills"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    className="profile-input"
                                    placeholder="e.g. React, Node.js, Python"
                                />
                            </div>
                            <div className="form-group">
                                <label>Experience (years)</label>
                                <input
                                    type="text"
                                    name="experience"
                                    value={formData.experience}
                                    onChange={handleChange}
                                    className="profile-input"
                                />
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
                                    {user.profile?.skills && user.profile.skills.length > 0
                                        ? user.profile.skills.join(', ')
                                        : 'No skills listed'}
                                </div>
                            </div>

                            <div className="detail-group">
                                <label>Experience</label>
                                <div className="detail-value">{user.profile?.experience || 'Not provided'}</div>
                            </div>
                        </div>
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
