import React, { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import './Auth.css';

const ResetPassword = ({ onClose, email: initialEmail, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        email: initialEmail || '',
        otp: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(60);

    const startTimer = () => {
        setTimer(60);
        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        startTimer();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleResendOTP = async () => {
        if (timer > 0) return;
        setLoading(true);
        try {
            await authAPI.resendOTP(formData.email, 'password-reset');
            toast.success('New OTP sent!');
            startTimer();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.resetPassword({
                email: formData.email,
                otp: formData.otp,
                newPassword: formData.newPassword
            });
            toast.success(response.message || 'Password reset successful!');
            setTimeout(() => {
                onSwitchToLogin();
            }, 2000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Reset failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="auth-close" onClick={onClose}>✕</button>

                <div className="auth-header">
                    <h2>Reset Password</h2>
                    <p>Enter the code sent to your email</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="otp-info">
                        <p>Code sent to</p>
                        <strong>{formData.email}</strong>
                    </div>

                    <div className="form-group">
                        <label>OTP Code</label>
                        <input
                            type="text"
                            name="otp"
                            value={formData.otp}
                            onChange={handleChange}
                            placeholder="6-digit code"
                            maxLength={6}
                            required
                            className="otp-input"
                        />
                    </div>

                    <div className="otp-timer" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                        {timer > 0 ? (
                            <p style={{ color: '#64748b' }}>Resend in {timer}s</p>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendOTP}
                                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: '700', cursor: 'pointer' }}
                            >
                                Resend OTP
                            </button>
                        )}
                    </div>

                    <div className="form-group">
                        <label>New Password</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="Min 6 characters"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
