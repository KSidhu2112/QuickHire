import React from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaSignInAlt, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import './Home.css';

const Home = () => {
    return (
        <div className="home-container container">
            <div className="hero-section">
                <h1 className="hero-title">Welcome to QuickHire Admin</h1>
                <p className="hero-subtitle">
                    Manage your platform efficiently and securely.
                </p>

            </div>

            <div className="dashboard-grid">
                <Link to="/settings" className="dashboard-card">
                    <FaShieldAlt className="card-icon" />
                    <h3 className="card-title">Secure Platform</h3>
                    <p className="card-desc">Advanced security features for managing users and data.</p>
                </Link>

                <Link to="/dashboard" className="dashboard-card">
                    <FaChartLine className="card-icon" />
                    <h3 className="card-title">Real-time Analytics</h3>
                    <p className="card-desc">Track platform growth and user engagement instantly.</p>
                </Link>

                <Link to="/dashboard" className="dashboard-card">
                    <FaUserPlus className="card-icon" />
                    <h3 className="card-title">User Management</h3>
                    <p className="card-desc">Efficiently manage employers and job seekers.</p>
                </Link>
            </div>
        </div>
    );
};

export default Home;
