import React, { useState } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import './Auth.css';

const ForgotPassword = ({ onClose, onSwitchToLogin, onOTPSent }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            toast.error('Please enter your email');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.forgotPassword(email);
            toast.success(response.message || 'OTP sent to your email!');
            if (onOTPSent) onOTPSent(email);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="auth-close" onClick={onClose}>✕</button>

                <div className="auth-header">
                    <h2>Forgot Password</h2>
                    <p>Enter your email to receive a reset code</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your registered email"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Sending OTP...' : 'Send OTP'}
                    </button>

                    <p className="auth-switch">
                        Remember your password?{' '}
                        <span onClick={onSwitchToLogin}>Login</span>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
