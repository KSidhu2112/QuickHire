import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    FaBolt, FaUserCircle, FaBriefcase, FaPaperPlane,
    FaExchangeAlt, FaHistory, FaEye, FaArrowRight
} from 'react-icons/fa';
import './ActivityMonitor.css';

const ActivityMonitor = () => {
    const [activities, setActivities] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchActivity = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                if (!token) {
                    setError('Authentication required');
                    setTimeout(() => window.location.href = '/login', 2000);
                    return;
                }

                const headers = { Authorization: `Bearer ${token}` };

                // Fetch stats and latest jobs/apps to form an activity feed
                const [statsRes, jobsRes, appsRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/admin/stats', { headers }),
                    axios.get('http://localhost:5000/api/admin/jobs?limit=10', { headers }),
                    axios.get('http://localhost:5000/api/admin/applications?limit=10', { headers })
                ]);

                if (statsRes.data.success) {
                    setStats(statsRes.data.data.stats);
                }

                // Combine and sort by date to create an "Activity Feed"
                const combined = [
                    ...(jobsRes.data.data || []).map(item => ({
                        id: item._id,
                        type: 'JOB_POSTED',
                        title: item.title,
                        user: item.employer?.name,
                        time: item.createdAt,
                        details: `Budget: ₹${item.budget || item.salaryMin || 0}`,
                        icon: <FaBriefcase />,
                        color: '#38bdf8'
                    })),
                    ...(appsRes.data.data || []).map(item => ({
                        id: item._id,
                        type: 'APPLICATION_SUBMITTED',
                        title: item.job?.title,
                        user: item.jobseeker?.name,
                        employer: item.employer?.name,
                        time: item.createdAt,
                        details: `Applied for ${item.job?.title}`,
                        icon: <FaPaperPlane />,
                        color: '#10b981'
                    }))
                ].sort((a, b) => new Date(b.time) - new Date(a.time));

                setActivities(combined.slice(0, 15));
                setError('');
            } catch (err) {
                console.error('Error fetching activity:', err);
                if (err.response?.status === 401) {
                    setError('Session expired. Redirecting to login...');
                    localStorage.removeItem('adminToken');
                    setTimeout(() => window.location.href = '/login', 2500);
                } else {
                    setError('Failed to fetch real-time data');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
        const interval = setInterval(fetchActivity, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="monitor-loader">Initialising Activity Monitor...</div>;

    return (
        <div className="monitor-container">
            <header className="monitor-header">
                <div className="header-content">
                    <h1>Live Platform Monitor</h1>
                    <p>Real-time overview of interactions between Employers & Employees</p>
                </div>
                <div className="live-badge">
                    <span className="pulse"></span>
                    Live Data
                </div>
            </header>

            {error && <div className="error-banner" style={{ backgroundColor: '#fee2e2', color: '#dc2626', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #fecaca', textAlign: 'center' }}>
                {error}
            </div>}

            <div className="monitor-grid">
                {/* Left: Live Feed */}
                <div className="feed-section glass-card">
                    <div className="card-header">
                        <FaHistory />
                        <h3>Recent Activity Feed</h3>
                    </div>
                    <div className="activity-list">
                        {activities.map((activity, index) => (
                            <div key={`${activity.id}-${index}`} className="activity-item">
                                <div className="activity-icon" style={{ backgroundColor: activity.color }}>
                                    {activity.icon}
                                </div>
                                <div className="activity-details">
                                    <div className="activity-main">
                                        <strong>{activity.user}</strong>
                                        {activity.type === 'JOB_POSTED' ? ' posted a new job: ' : ' applied to '}
                                        <span className="highlight">{activity.title}</span>
                                    </div>
                                    <div className="activity-meta">
                                        <span>{new Date(activity.time).toLocaleTimeString()}</span>
                                        <span className="dot"></span>
                                        <span>{activity.details}</span>
                                    </div>
                                    {activity.employer && (
                                        <div className="activity-pairing">
                                            <FaArrowRight /> <span>Employer: {activity.employer}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Summary & Connections */}
                <div className="side-section">
                    <div className="interaction-card glass-card">
                        <div className="card-header">
                            <FaExchangeAlt />
                            <h3>Platform Ecosystem</h3>
                        </div>
                        <div className="eco-stats">
                            <div className="eco-item">
                                <label>Total Interactions</label>
                                <h2>{(stats?.totalApplications || 0) + (stats?.totalJobs || 0)}</h2>
                            </div>
                            <div className="eco-item">
                                <label>Success Rate</label>
                                <h2>{stats?.totalJobs > 0 ? ((stats.completedJobs / stats.totalJobs) * 100).toFixed(1) : '0.0'}%</h2>
                            </div>
                        </div>
                        <div className="interaction-visual">
                            <div className="v-circle employer-node">
                                <FaUserCircle />
                                <span>{stats?.totalEmployers || 0} Employers</span>
                            </div>
                            <div className="v-line">
                                <div className="v-pulse-ball"></div>
                            </div>
                            <div className="v-circle employee-node">
                                <FaUserCircle />
                                <span>{stats?.totalEmployees || 0} Employees</span>
                            </div>
                        </div>
                        <p className="v-caption">Active matching happening between {stats?.totalEmployers || 0} hirers and {stats?.totalEmployees || 0} workers.</p>
                    </div>

                    <div className="quick-access-card glass-card">
                        <div className="card-header">
                            <FaEye />
                            <h3>Quick Monitoring</h3>
                        </div>
                        <div className="mini-links">
                            <div className="mini-link">
                                <span>Active Jobs</span>
                                <span className="val">{stats?.activeJobs || 0}</span>
                            </div>
                            <div className="mini-link">
                                <span>Recent Applications</span>
                                <span className="val">{stats?.totalApplications || 0}</span>
                            </div>
                            <div className="mini-link">
                                <span>New Registrations</span>
                                <span className="val">+{stats?.totalUsers || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityMonitor;
