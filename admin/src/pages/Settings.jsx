import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Settings.css';

const Settings = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/login');
            return;
        }

        // Fetch current account details
        fetchAccountDetails();
    }, [navigate]);

    const fetchAccountDetails = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('http://localhost:5000/api/admin/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFormData(prev => ({
                    ...prev,
                    name: data.name || '',
                    email: data.email || ''
                }));
            } else {
                // Use mock data if API fails
                setFormData(prev => ({
                    ...prev,
                    name: 'Admin User',
                    email: 'admin@quickhire.com'
                }));
            }
        } catch (error) {
            console.error('Error fetching account details:', error);
            setFormData(prev => ({
                ...prev,
                name: 'Admin User',
                email: 'admin@quickhire.com'
            }));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate passwords if changing password
        if (formData.newPassword) {
            if (formData.newPassword !== formData.confirmPassword) {
                toast.error('New passwords do not match!');
                return;
            }
            if (formData.newPassword.length < 6) {
                toast.error('Password must be at least 6 characters long!');
                return;
            }
            if (!formData.currentPassword) {
                toast.error('Please enter your current password!');
                return;
            }
        }

        setSaving(true);

        try {
            const token = localStorage.getItem('adminToken');
            const updateData = {
                name: formData.name,
                email: formData.email
            };

            // Add password fields if changing password
            if (formData.newPassword) {
                updateData.currentPassword = formData.currentPassword;
                updateData.newPassword = formData.newPassword;
            }

            const response = await fetch('http://localhost:5000/api/admin/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            if (response.ok) {
                toast.success('Account updated successfully!');
                // Clear password fields
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to update account');
            }
        } catch (error) {
            console.error('Error updating account:', error);
            toast.error('An error occurred while updating your account');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="settings-container">
                <div className="loading">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="settings-container">
            <div className="settings-card">
                <div className="card-header">
                    <h1>Account Settings</h1>
                    <p className="subtitle">Update your account information and password</p>
                </div>

                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="form-section">
                        <h2 className="section-title">Personal Information</h2>

                        <div className="form-group">
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2 className="section-title">Change Password</h2>
                        <p className="section-description">Leave blank if you don't want to change your password</p>

                        <div className="form-group">
                            <label htmlFor="currentPassword">Current Password</label>
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Enter current password"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Enter new password"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm New Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => navigate(-1)}
                            disabled={saving}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
