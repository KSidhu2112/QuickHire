import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || 'https://quickhire-9ous.onrender.com/api';
import './Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await axios.post(`${API_BASE}/auth/forgot-password`, { email });
            setMessage(res.data.message);

            // Redirect to reset password page after short delay
            setTimeout(() => {
                navigate(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2 className="auth-title">Forgot Password</h2>
                <p className="auth-subtitle">Enter your email to receive an OTP</p>

                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message" style={{ color: 'var(--success-color)', marginBottom: '1rem', background: '#ecfdf5', padding: '0.75rem', borderRadius: '0.5rem' }}>{message}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@quickhire.com"
                            required
                            className="form-input"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>
                </form>

                <div className="auth-footer">
                    Remember your password?
                    <Link to="/login" className="auth-link">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
