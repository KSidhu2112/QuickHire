import React, { useEffect, useState } from 'react';
import { FaUserPlus, FaUserTie, FaBriefcase, FaArrowRight, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || 'https://quickhire-9ous.onrender.com/api';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalEmployers: 0,
        totalEmployees: 0,
        totalJobs: 0,
        totalApplications: 0,
        activeJobs: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                };
                const res = await axios.get(`${API_BASE}/admin/stats`, config);
                if (res.data.success) {
                    setStats(res.data.data.stats);
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="dashboard-container container">
            <header className="dashboard-header">
                <h2>Platform Overview</h2>
                <p>Real-time metrics and management shortcuts</p>
            </header>

            <section className="stats-grid">
                <NavLink to="/dashboard/users" className="stat-card">
                    <FaUserTie className="stat-icon" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }} />
                    <div className="stat-info">
                        <span>Employers</span>
                        <h3>{stats.totalEmployers || 0}</h3>
                    </div>
                </NavLink>
                <NavLink to="/dashboard/users" className="stat-card">
                    <FaUserPlus className="stat-icon" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }} />
                    <div className="stat-info">
                        <span>Job Seekers</span>
                        <h3>{stats.totalEmployees || 0}</h3>
                    </div>
                </NavLink>
                <NavLink to="/dashboard/jobs" className="stat-card">
                    <FaBriefcase className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }} />
                    <div className="stat-info">
                        <span>Total Jobs</span>
                        <h3>{stats.totalJobs || 0}</h3>
                    </div>
                </NavLink>
                <NavLink to="/dashboard/activity-monitor" className="stat-card">
                    <FaChartLine className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }} />
                    <div className="stat-info">
                        <span>Active Jobs</span>
                        <h3>{stats.activeJobs || 0}</h3>
                    </div>
                </NavLink>
            </section>

            <section className="recent-activity">
                <h3 className="section-title">Quick Control Center</h3>
                <div className="link-card-grid">
                    <NavLink to="/dashboard/users" className="link-card">
                        <FaShieldAlt className="link-card-icon" />
                        <h3>Identity Management</h3>
                        <p>Verify profiles, manage trust scores, and suspend accounts.</p>
                        <span className="btn btn-outline">Access Control <FaArrowRight /></span>
                    </NavLink>
                    <NavLink to="/dashboard/applications" className="link-card">
                        <FaBriefcase className="link-card-icon" />
                        <h3>Hiring Pipeline</h3>
                        <p>Track applications from submission to payment release.</p>
                        <span className="btn btn-outline">Track Lifecycle <FaArrowRight /></span>
                    </NavLink>
                    <NavLink to="/dashboard/payments" className="link-card">
                        <FaArrowRight className="link-card-icon" style={{ transform: 'rotate(-45deg)' }} />
                        <h3>Financial Audit</h3>
                        <p>Monitor platform revenue and transaction success rates.</p>
                        <span className="btn btn-outline">View Payments <FaArrowRight /></span>
                    </NavLink>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
