import React, { useEffect, useState } from 'react';
import {
    FaUsers, FaBriefcase, FaFileAlt, FaCreditCard,
    FaChartLine, FaExclamationCircle, FaUserClock
} from 'react-icons/fa';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './Dashboard.css';

ChartJS.register(
    CategoryScale, LinearScale, PointElement, LineElement,
    Title, Tooltip, Legend, Filler
);

const Overview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const res = await axios.get('http://localhost:5000/api/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (err) {
                console.error('Error fetching admin data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading || !stats) return <div className="loading-spinner">Loading Overview...</div>;

    const s = stats.stats || {};
    const c = stats.charts || {};

    const chartData = {
        labels: c?.jobsPerDay ? c.jobsPerDay.map(d => d._id) : [],
        datasets: [
            {
                label: 'New Jobs',
                data: c?.jobsPerDay ? c.jobsPerDay.map(d => d.count) : [],
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    return (
        <div className="overview-container">
            <h1 className="page-title">Dashboard Overview</h1>

            <div className="stats-grid">
                <StatCard icon={<FaUsers />} label="Total Users" value={s.totalUsers || 0} color="#8b5cf6" />
                <StatCard icon={<FaBriefcase />} label="Live Jobs" value={s.totalJobs || 0} color="#3b82f6" />
                <StatCard icon={<FaFileAlt />} label="Applications" value={s.totalApplications || 0} color="#10b981" />
                <StatCard icon={<FaUserClock />} label="Active Jobs" value={s.activeJobs || 0} color="#f59e0b" />
            </div>

            <div className="chart-section">
                <div className="chart-card">
                    <h3>Recent Job Growth (30 Days)</h3>
                    <div className="chart-container">
                        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="summary-list-card">
                    <h3>Platform Summary</h3>
                    <div className="summary-item">
                        <span>Employers</span>
                        <strong>{s.totalEmployers || 0}</strong>
                    </div>
                    <div className="summary-item">
                        <span>Employees</span>
                        <strong>{s.totalEmployees || 0}</strong>
                    </div>
                    <div className="summary-item">
                        <span>Completed Jobs</span>
                        <strong>{s.completedJobs || 0}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div className="overview-stat-card" style={{ '--accent': color }}>
        <div className="stat-icon-bg">{icon}</div>
        <div className="stat-details">
            <span className="stat-label">{label}</span>
            <h2 className="stat-value">{value}</h2>
        </div>
    </div>
);

export default Overview;
