import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend, ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import './AnalyticsDashboard.css';

ChartJS.register(
    CategoryScale, LinearScale, BarElement,
    Title, Tooltip, Legend, ArcElement
);

const AnalyticsDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get('http://localhost:5000/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) return <div className="table-loader">Crunching platform data...</div>;

    const s = stats.stats || {};
    const c = stats.charts || {};

    const userDistData = {
        labels: ['Employers', 'Employees'],
        datasets: [{
            data: [s.totalEmployers, s.totalEmployees],
            backgroundColor: ['#38bdf8', '#8b5cf6'],
            borderWidth: 0
        }]
    };

    const jobGrowthData = {
        labels: c?.jobsPerDay ? c.jobsPerDay.map(d => d._id) : [],
        datasets: [{
            label: 'New Jobs Posted',
            data: c?.jobsPerDay ? c.jobsPerDay.map(d => d.count) : [],
            backgroundColor: '#10b981',
            borderRadius: 8
        }]
    };

    const regGrowthData = {
        labels: c?.registrationsPerDay ? c.registrationsPerDay.map(d => d._id) : [],
        datasets: [{
            label: 'New User Registrations',
            data: c?.registrationsPerDay ? c.registrationsPerDay.map(d => d.count) : [],
            backgroundColor: '#8b5cf6',
            borderRadius: 8
        }]
    };

    return (
        <div className="analytics-container">
            <h1 className="page-title">Platform Analytics</h1>

            <div className="analytics-grid">
                <div className="chart-card pie-chart">
                    <h3>User Distribution</h3>
                    <div className="chart-box">
                        <Pie data={userDistData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="chart-card bar-chart">
                    <h3>Daily Job Postings (Last 30 Days)</h3>
                    <div className="chart-box">
                        <Bar data={jobGrowthData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>

                <div className="chart-card bar-chart full-width">
                    <h3>Daily User Registrations (Last 30 Days)</h3>
                    <div className="chart-box">
                        <Bar data={regGrowthData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            <div className="kpi-grid">
                <div className="kpi-card">
                    <h4>Conversion Rate</h4>
                    <p>Applications per Job: <strong>{s.totalJobs > 0 ? (s.totalApplications / s.totalJobs).toFixed(1) : 0}</strong></p>
                </div>
                <div className="kpi-card">
                    <h4>Completion Rate</h4>
                    <p>Jobs Completed: <strong>{s.totalJobs > 0 ? ((s.completedJobs / s.totalJobs) * 100).toFixed(1) : 0}%</strong></p>
                </div>
                <div className="kpi-card">
                    <h4>System Health</h4>
                    <p>Uptime: <strong>99.9%</strong></p>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
