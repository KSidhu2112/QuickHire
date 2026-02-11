import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css'; // Shared CSS

const Signup = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        otp: ''
    });
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const { name, email, password, confirmPassword, otp } = formData;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setError('');
        setMessage('');
        setLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/auth/send-otp', {
                email,
                name
            });

            setMessage(res.data.message);
            setStep(2); // Move to OTP step
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const res = await axios.post('http://localhost:5000/api/auth/register', {
                name,
                email,
                password,
                otp,
                role: 'admin' // Explicitly registering as admin
            });

            setMessage('Registration successful! Redirecting to login...');

            // Redirect to login after short delay
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please check OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-box">
                <h2 className="auth-title">Admin Signup</h2>
                <p className="auth-subtitle">
                    {step === 1 ? 'Create a new admin account' : 'Verify your email'}
                </p>

                {error && <div className="error-message">{error}</div>}
                {message && <div className="success-message" style={{ color: 'var(--success-color)', marginBottom: '1rem', background: '#ecfdf5', padding: '0.75rem', borderRadius: '0.5rem' }}>{message}</div>}

                {step === 1 ? (
                    <form className="auth-form" onSubmit={handleSendOTP}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={name}
                                onChange={handleChange}
                                placeholder="Ex. John Doe"
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={email}
                                onChange={handleChange}
                                placeholder="admin@quickhire.com"
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="form-input"
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Sending OTP...' : 'Next: Verify Email'}
                        </button>
                    </form>
                ) : (
                    <form className="auth-form" onSubmit={handleRegister}>
                        <div className="form-group">
                            <label className="form-label" htmlFor="otp">OTP Code</label>
                            <input
                                type="text"
                                id="otp"
                                name="otp"
                                value={otp}
                                onChange={handleChange}
                                placeholder="Enter 6-digit OTP"
                                required
                                className="form-input"
                                maxLength="6"
                            />
                            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
                                We sent a code to <strong>{email}</strong>
                            </p>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Verify & Register'}
                        </button>

                        <button
                            type="button"
                            className="btn"
                            style={{ background: 'transparent', color: '#666', marginTop: '10px' }}
                            onClick={() => setStep(1)}
                        >
                            Back to Details
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    Already have an account?
                    <Link to="/login" className="auth-link">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;
