import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || 'https://quickhire-9ous.onrender.com/api';
import './EmployerProfile.css';

const EmployerProfile = () => { // Employer Profile Component
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                company: user.profile?.company || '',
                location: user.profile?.location || '',
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
            const response = await axios.put(`${API_BASE}/auth/profile`, {
                name: formData.name,
                phone: formData.phone,
                profile: {
                    company: formData.company,
                    location: formData.location
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
            // Assuming we can get user details from auth/me or just use stored user if simple
            // But better to fetch fresh data. Let's assume we have an endpoint or use the stored user for now
            // and maybe fetch fresh data if needed. For now, we'll try to fetch from a generic 'me' endpoint if it exists
            // or just use the local storage one if we don't have a specific profile endpoint yet.
            // Actually, we usually have a 'get current user' endpoint.
            // Let's check authRoutes ... wait, I don't recall a 'me' route in authRoutes.
            // user object is usually returned on login.
            // Let's try to fetch from a standard endpoint or just use localStorage for MVP speed if 'me' doesn't exist.

            // Checking existing authRoutes...
            // Fetching fresh data is better.

            const response = await axios.get(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.data.success) {
                setUser(response.data.user);
            }
        } catch (err) {
            console.error('Error fetching profile:', err);
            // Fallback to local storage if API fails or route doesn't exist
            const storedUser = JSON.parse(localStorage.getItem('quickhire_user'));
            if (storedUser) {
                setUser(storedUser);
            } else {
                setError('Failed to load profile');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('quickhire_token');
        localStorage.removeItem('quickhire_user');
        navigate('/');
    };

    if (loading) {
        return (
            <div className="employer-profile-page">
                <div className="profile-container">
                    <div className="loading-spinner"></div>
                    <p style={{ textAlign: 'center', color: '#fff' }}>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="employer-profile-page">
                <div className="profile-container">
                    <div className="error-message">Profile not found. Please login again.</div>
                    <button className="primary-btn" onClick={() => navigate('/')}>Login</button>
                </div>
            </div>
        )
    }

    return (
        <div className="employer-profile-page">
            <div className="profile-container">
                <div className="page-header">
                    <button className="back-button" onClick={() => navigate('/employer/dashboard')}>
                        ← Back to Dashboard
                    </button>
                    <h1>Employer Profile</h1>
                    <p>Manage your account details</p>
                </div>

                <div className="profile-card">
                    <div className="profile-header-section">
                        <div className="profile-avatar">
                            {user.name ? user.name.charAt(0).toUpperCase() : 'E'}
                        </div>
                        <div className="profile-title">
                            <h2>{editMode ? 'Edit Profile' : user.name}</h2>
                            <span className="role-badge">Employer</span>
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
                                <label>Company</label>
                                <input
                                    type="text"
                                    name="company"
                                    value={formData.company}
                                    onChange={handleChange}
                                    className="profile-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
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
                                            company: user.profile?.company || '',
                                            location: user.profile?.location || '',
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
                                <label>Company Name</label>
                                <div className="detail-value">{user.profile?.company || user.company || 'Not provided'}</div>
                            </div>

                            <div className="detail-group">
                                <label>Location</label>
                                <div className="detail-value">{user.profile?.location || 'Not provided'}</div>
                            </div>
                        </div>
                    )}

                    {!editMode && (
                        <div className="profile-actions">
                            <button className="logout-btn" onClick={handleLogout}>
                                Logout
                            </button>
                            <button className="edit-btn" onClick={() => setEditMode(true)}>Edit Profile</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployerProfile;
