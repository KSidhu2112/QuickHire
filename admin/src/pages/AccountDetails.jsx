import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_URL || 'https://quickhire-9ous.onrender.com/api';
import './AccountDetails.css';

const AccountDetails = () => {
    const navigate = useNavigate();
    const [accountData, setAccountData] = useState({
        name: '',
        email: '',
        role: 'Admin',
        createdAt: '',
        lastLogin: ''
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is authenticated
        const token = localStorage.getItem('adminToken');
        if (!token) {
            navigate('/login');
            return;
        }

        // Fetch account details from API
        fetchAccountDetails();
    }, [navigate]);

    const fetchAccountDetails = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_BASE}/admin/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setAccountData({
                    name: data.name || 'Admin User',
                    email: data.email || '',
                    role: data.role || 'Admin',
                    createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A',
                    lastLogin: data.lastLogin ? new Date(data.lastLogin).toLocaleString() : 'N/A'
                });
            } else {
                // If API fails, use mock data for demonstration
                setAccountData({
                    name: 'Admin User',
                    email: 'admin@quickhire.com',
                    role: 'Admin',
                    createdAt: new Date().toLocaleDateString(),
                    lastLogin: new Date().toLocaleString()
                });
            }
        } catch (error) {
            console.error('Error fetching account details:', error);
            // Use mock data on error
            setAccountData({
                name: 'Admin User',
                email: 'admin@quickhire.com',
                role: 'Admin',
                createdAt: new Date().toLocaleDateString(),
                lastLogin: new Date().toLocaleString()
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="account-details-container">
                <div className="loading">Loading account details...</div>
            </div>
        );
    }

    return (
        <div className="account-details-container">
            <div className="account-details-card">
                <div className="card-header">
                    <h1>Account Details</h1>
                    <p className="subtitle">View your account information</p>
                </div>

                <div className="account-info">
                    <div className="info-row">
                        <div className="info-label">Full Name</div>
                        <div className="info-value">{accountData.name}</div>
                    </div>

                    <div className="info-row">
                        <div className="info-label">Email Address</div>
                        <div className="info-value">{accountData.email}</div>
                    </div>

                    <div className="info-row">
                        <div className="info-label">Role</div>
                        <div className="info-value">
                            <span className="role-badge">{accountData.role}</span>
                        </div>
                    </div>

                    <div className="info-row">
                        <div className="info-label">Account Created</div>
                        <div className="info-value">{accountData.createdAt}</div>
                    </div>

                    <div className="info-row">
                        <div className="info-label">Last Login</div>
                        <div className="info-value">{accountData.lastLogin}</div>
                    </div>
                </div>

                <div className="card-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/settings')}
                    >
                        Edit Account
                    </button>
                    <button
                        className="btn btn-outline"
                        onClick={() => navigate(-1)}
                    >
                        Go Back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AccountDetails;
