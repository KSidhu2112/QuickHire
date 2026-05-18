import React, { useState, useEffect } from 'react';
import './Home.css';
import heroImage from '../assets/hero_image.png';
import { jobAPI } from '../services/api';

const Home = () => {
    const [stats, setStats] = useState({
        noOfJobs: 0,
        noOfEmployees: 0,
        noOfEmployers: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await jobAPI.getPublicStats();
                if (res.success && res.stats) {
                    setStats(res.stats);
                }
            } catch (err) {
                console.error('Error fetching public stats:', err);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="home-container">
            {/* Hero Section */}
            {/* Hero Section */}
            <section className="hero-section" id="home">
                <div className="hero-content">
                    <div className="hero-text">
                        <h1 className="hero-title">
                            Find Your Dream Job with{' '}
                            <span className="gradient-text">AI-Powered Precision</span>
                        </h1>
                        <p className="hero-description">
                            QuickHire revolutionizes job searching with intelligent matching algorithms,
                            connecting talented professionals with their perfect career opportunities in seconds.
                        </p>

                        {/* Stats */}
                        <div className="hero-stats">
                            <div className="stat-item">
                                <h3>{stats.noOfJobs}</h3>
                                <p>Jobs Available</p>
                            </div>
                            <div className="stat-item">
                                <h3>{stats.noOfEmployees}</h3>
                                <p>Employees</p>
                            </div>
                            <div className="stat-item">
                                <h3>{stats.noOfEmployers}</h3>
                                <p>Employers</p>
                            </div>
                        </div>
                    </div>

                    <div className="hero-image">
                        <img src={heroImage} alt="Find Your Dream Job" className="hero-main-image" />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="section-header">
                    <h2>Why Choose QuickHire?</h2>
                    <p>Experience the future of job hunting with our cutting-edge platform</p>
                </div>

                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🤖</div>
                        <h3>AI-Powered Matching</h3>
                        <p>Our advanced AI analyzes your skills and preferences to find perfect job matches instantly.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">⚡</div>
                        <h3>Instant Applications</h3>
                        <p>Apply to multiple jobs with one click. Save time and increase your chances of success.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🎯</div>
                        <h3>Smart Recommendations</h3>
                        <p>Get personalized job suggestions based on your profile and career goals.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">📈</div>
                        <h3>Career Growth</h3>
                        <p>Track your applications, get insights, and grow your career with our analytics tools.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3>Secure & Private</h3>
                        <p>Your data is protected with enterprise-grade security and privacy measures.</p>
                    </div>

                    <div className="feature-card">
                        <div className="feature-icon">🌟</div>
                        <h3>Top Companies</h3>
                        <p>Connect with leading companies actively looking for talented professionals like you.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
