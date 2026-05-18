import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaClock, FaCheckCircle, FaTimesCircle, FaTasks, FaSearch } from 'react-icons/fa';
import './ApplicationTracking.css';

const ApplicationTracking = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get('http://localhost:5000/api/admin/applications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setApplications(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching applications:', err);
        } finally {
            setLoading(false);
        }
    };

    const filteredApps = applications.filter(app =>
        app.job?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.jobseeker?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.employer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="app-tracking-container">
            <header className="page-header">
                <h1 className="page-title">Application Tracking</h1>
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search applications..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="app-list">
                {loading ? (
                    <div className="table-loader">Loading tracking data...</div>
                ) : filteredApps.length === 0 ? (
                    <div className="empty-state">No applications found.</div>
                ) : (
                    <div className="app-table-card card">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Job Title</th>
                                    <th>Employer</th>
                                    <th>Employee</th>
                                    <th>Contact Info</th>
                                    <th>Payment Details</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApps.map(app => (
                                    <tr key={app._id}>
                                        <td className="job-title-cell">{app.job?.title}</td>
                                        <td>
                                            <div className="name-cell">
                                                <strong>{app.employer?.name}</strong>
                                                <span className="email">{app.employer?.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="name-cell">
                                                <strong>{app.jobseeker?.name}</strong>
                                                <span className="email">{app.jobseeker?.email}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="contact-info-cell">
                                                <span className="phone">📞 {app.trustDetails?.contactMobile || app.jobseeker?.phone || 'N/A'}</span>
                                                {app.trustDetails?.contactMobile && <span className="trust-badge-mini" title="Verified via Trust Feature">🛡️ Trust</span>}
                                            </div>
                                        </td>
                                        <td>
                                            {app.trustDetails?.paymentMethod ? (
                                                <div className="payment-info-cell">
                                                    <span className="method">{app.trustDetails.paymentMethod}</span>
                                                    <span className="val">{app.trustDetails.paymentValue}</span>
                                                </div>
                                            ) : <span className="not-provided">Legacy / Not Provided</span>}
                                        </td>
                                        <td>{new Date(app.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`status-pill ${app.status.toLowerCase()}`}>
                                                {app.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="audit-status-cell" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>
                                                <div style={{ color: (app.work_status === 'Completed' || app.workStatus === 'COMPLETED') ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    {(app.work_status === 'Completed' || app.workStatus === 'COMPLETED') && <FaCheckCircle />}
                                                    <strong>Work:</strong> {app.work_status || 'Pending'}
                                                </div>
                                                <div style={{ color: (app.payment_status === 'Paid' || app.paymentStatus === 'RELEASED') ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    {(app.payment_status === 'Paid' || app.paymentStatus === 'RELEASED') && <FaCheckCircle />}
                                                    <strong>Payment:</strong> {app.payment_status || 'Pending'}
                                                </div>
                                                <div style={{ color: (app.employerRated && app.employeeRated) ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    {(app.employerRated && app.employeeRated) && <FaCheckCircle />}
                                                    <strong>Mutual Rating:</strong> {app.employerRated && app.employeeRated ? 'Verified & Published' : (app.employerRated || app.employeeRated ? 'Partial' : 'Pending')}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

const getStepIndex = (status) => {
    const steps = ['APPLIED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED'];
    return steps.indexOf(status);
};

export default ApplicationTracking;
