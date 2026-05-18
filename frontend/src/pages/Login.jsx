import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';
import './Auth.css';

const Login = ({ onClose, onSwitchToSignup }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.email || !formData.password) {
            toast.error('Please fill all fields');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.login(formData.email, formData.password);
            toast.success(`Welcome back, ${response.user.name}!`);

            // Close modal
            if (onClose) onClose();

            // Redirect based on role
            setTimeout(() => {
                if (onClose) {
                    // If used as modal, just reload or navigate
                    window.location.reload();
                } else {
                    if (response.user.role === 'jobseeker') {
                        navigate('/dashboard');
                    } else if (response.user.role === 'employer') {
                        navigate('/employer/dashboard');
                    } else {
                        navigate('/');
                    }
                }
            }, 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="auth-close" onClick={onClose}>✕</button>

                <div className="auth-header">
                    <h2>Welcome Back!</h2>
                    <p>Login to continue your job search</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
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
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <div className="form-options">
                        <label className="checkbox-label">
                            <input type="checkbox" />
                            <span>Remember me</span>
                        </label>
                        <a href="#forgot" className="forgot-link">Forgot Password?</a>
                    </div>

                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <p className="auth-switch">
                        Don't have an account?{' '}
                        <span onClick={onSwitchToSignup || (() => navigate('/signup'))}>Sign Up</span>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
