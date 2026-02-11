import React, { useEffect, useState } from 'react';
import { FaUserPlus, FaUserTie, FaBriefcase, FaArrowRight } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        employers: 0,
        employees: 0,
        jobs: 0
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
                const res = await axios.get('http://localhost:5000/api/admin/stats', config);
                if (res.data.success) {
                    setStats(res.data.data);
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
                <h2>Admin Dashboard</h2>
            </header>

            <section className="stats-grid">
                <NavLink to="/dashboard/employers" className="stat-card">
                    <FaUserTie className="stat-icon" />
                    <div className="stat-info">
                        <span>Total Employers</span>
                        <h3>{stats.employers}</h3>
                    </div>
                </NavLink>
                <NavLink to="/dashboard/employees" className="stat-card">
                    <FaUserPlus className="stat-icon" />
                    <div className="stat-info">
                        <span>Active Job Seekers</span>
                        <h3>{stats.employees}</h3>
                    </div>
                </NavLink>
                <NavLink to="/dashboard/jobs" className="stat-card">
                    <FaBriefcase className="stat-icon" />
                    <div className="stat-info">
                        <span>Live Jobs</span>
                        <h3>{stats.jobs}</h3>
                    </div>
                </NavLink>
            </section>

            <section className="recent-activity">
                <h3 className="section-title">Quick Actions</h3>
                <div className="link-card-grid">
                    <NavLink to="/dashboard/employers" className="link-card">
                        <FaUserPlus className="link-card-icon" />
                        <h3>Manage Employers</h3>
                        <p>View, verify, or remove employer accounts.</p>
                        <span className="btn btn-outline">Go to Employers <FaArrowRight /></span>
                    </NavLink>
                    <NavLink to="/dashboard/employees" className="link-card">
                        <FaUserPlus className="link-card-icon" />
                        <h3>Manage Employees</h3>
                        <p>Review job seeker profiles and activity.</p>
                        <span className="btn btn-outline">Go to Employees <FaArrowRight /></span>
                    </NavLink>
                    <NavLink to="/dashboard/jobs" className="link-card">
                        <FaBriefcase className="link-card-icon" />
                        <h3>Manage Jobs</h3>
                        <p>Moderate job listings and categories.</p>
                        <span className="btn btn-outline">Go to Jobs <FaArrowRight /></span>
                    </NavLink>
                </div>
            </section>
        </div>
    );
};

export default Dashboard;
