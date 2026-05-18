import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import './Auth.css';

const Signup = ({ onClose, onSwitchToLogin }) => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Details, 2: OTP Verification
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'jobseeker',
        otp: '',
    });
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [timer, setTimer] = useState(0);

    // Handle input changes
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Start countdown timer
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

    // Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.name || !formData.email || !formData.password) {
            toast.error('Please fill all fields');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            console.log('📤 Sending OTP to:', formData.email);
            const response = await authAPI.sendOTP(formData.email, formData.name);
            console.log('✅ OTP Response:', response);
            toast.success('OTP sent to your email!');
            setOtpSent(true);
            setStep(2);
            startTimer();
        } catch (error) {
            console.error('❌ Send OTP Error:', error);
            console.error('Error Response:', error.response);

            // Handle specific error cases
            if (error.response?.status === 503) {
                toast.error('Database not available. Please try again later.');
            } else if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else if (error.message === 'Network Error') {
                toast.error('Cannot connect to server. Is the backend running?');
            } else {
                toast.error('Failed to send OTP. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        if (timer > 0) return;

        setLoading(true);
        try {
            await authAPI.resendOTP(formData.email);
            toast.success('New OTP sent!');
            startTimer();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    // Verify OTP and Register
    const handleRegister = async (e) => {
        e.preventDefault();

        if (!formData.otp || formData.otp.length !== 6) {
            toast.error('Please enter valid 6-digit OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                otp: formData.otp,
                role: formData.role,
            });

            toast.success('Registration successful! Welcome to QuickHire!');

            // Close modal
            if (onClose) onClose();

            // Redirect based on role
            setTimeout(() => {
                if (onClose) {
                    window.location.reload();
                } else {
                    if (formData.role === 'jobseeker') {
                        navigate('/dashboard');
                    } else if (formData.role === 'employer') {
                        navigate('/employer/dashboard');
                    } else {
                        navigate('/');
                    }
                }
            }, 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="auth-close" onClick={onClose}>✕</button>

                <div className="auth-header">
                    <h2>Create Account</h2>
                    <p>Join QuickHire and find your dream job</p>
                </div>

                {step === 1 ? (
                    <form onSubmit={handleSendOTP} className="auth-form">
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Create a password (min 6 characters)"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>I am a</label>
                            <select name="role" value={formData.role} onChange={handleChange}>
                                <option value="jobseeker">Job Seeker</option>
                                <option value="employer">Employer</option>
                            </select>
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Sending OTP...' : 'Send OTP'}
                        </button>

                        <p className="auth-switch">
                            Already have an account?{' '}
                            <span onClick={onSwitchToLogin || (() => navigate('/login'))}>Login</span>
                        </p>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="otp-info">
                            <p>We've sent a 6-digit OTP to</p>
                            <strong>{formData.email}</strong>
                        </div>

                        <div className="form-group">
                            <label>Enter OTP</label>
                            <input
                                type="text"
                                name="otp"
                                value={formData.otp}
                                onChange={handleChange}
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                                required
                                className="otp-input"
                            />
                        </div>

                        <div className="otp-timer">
                            {timer > 0 ? (
                                <p>Resend OTP in {timer}s</p>
                            ) : (
                                <p>
                                    Didn't receive OTP?{' '}
                                    <span onClick={handleResendOTP} style={{ cursor: 'pointer', color: '#2563eb' }}>
                                        Resend
                                    </span>
                                </p>
                            )}
                        </div>

                        <button type="submit" className="auth-button" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify & Register'}
                        </button>

                        <button
                            type="button"
                            className="auth-button-secondary"
                            onClick={() => setStep(1)}
                        >
                            Change Email
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Signup;
