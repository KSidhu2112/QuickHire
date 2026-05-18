import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEnvelope, FaCalendarAlt, FaBriefcase, FaMoneyBillWave, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
import './DetailPages.css';

const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const res = await axios.get(`http://localhost:5000/api/admin/employees/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success) {
                    setDetails(res.data.data);
                }
            } catch (err) {
                console.error('Error fetching details:', err);
                setError(err.response?.data?.message || 'Error fetching data');
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchDetails();
    }, [id]);

    if (loading) return <div className="details-page-container"><div className="loading-spinner">Loading Profile Details...</div></div>;
    if (error) return <div className="details-page-container"><div className="error-message">Error: {error}</div></div>;
    if (!details) return <div className="details-page-container"><div className="empty-state">No details found.</div></div>;

    const { employee, applications, paymentHistory } = details;

    const shortlistedJobs = applications.filter(app => app.status === 'UNDER_REVIEW');
    const hiredJobs = applications.filter(app => app.status === 'ACCEPTED');

    return (
        <div className="details-page-container">
            <header className="details-header">
                <button onClick={() => navigate('/dashboard/employees')} className="back-btn">
                    <FaArrowLeft /> Back
                </button>
            </header>

            <div className="profile-header-card">
                <div className="profile-main-info">
                    <div className="large-avatar">{employee.name.charAt(0)}</div>
                    <div className="info-content">
                        <h1>{employee.name}</h1>
                        <div className="info-grid">
                            <div className="info-item"><FaEnvelope /> {employee.email}</div>
                            <div className="info-item"><FaCalendarAlt /> Member since {new Date(employee.createdAt).toLocaleDateString()}</div>
                            <div className="info-item"><FaInfoCircle /> Account Status: <span className={`status-pill ${employee.status}`}>{employee.status}</span></div>
                        </div>
                    </div>
                </div>
                <div className="stats-container">
                    <div className="stat-box">
                        <span>Total Apps</span>
                        <strong>{applications.length}</strong>
                    </div>
                    <div className="stat-box">
                        <span>Hired In</span>
                        <strong>{hiredJobs.length}</strong>
                    </div>
                    <div className="stat-box">
                        <span>Shortlisted</span>
                        <strong>{shortlistedJobs.length}</strong>
                    </div>
                </div>
            </div>

            <div className="details-grid">
                {/* Hired Section */}
                <section className="section-card full-width">
                    <h3 style={{ color: 'var(--accent-color)' }}><FaCheckCircle /> Career Success (Hired)</h3>
                    <div className="hired-list">
                        {hiredJobs.length === 0 ? (
                            <p className="empty-text">Not hired by any employer yet.</p>
                        ) : (
                            <div className="hired-grid">
                                {hiredJobs.map((app, i) => (
                                    <div key={i} className="list-item hired-item">
                                        <div className="item-header">
                                            <h4>{app.jobTitle}</h4>
                                            <span className="status-pill accepted">HIRED</span>
                                        </div>
                                        <div className="item-meta">
                                            <span><strong>Employer:</strong> {app.employerName}</span>
                                            {app.employerCompany && <span><strong>Company:</strong> {app.employerCompany}</span>}
                                            <span><strong>Date:</strong> {new Date(app.appliedDate).toLocaleDateString()}</span>
                                        </div>

                                        <div className="dual-status-grid" style={{ 
                                            marginTop: '1rem', 
                                            padding: '0.75rem', 
                                            backgroundColor: 'rgba(0,0,0,0.02)', 
                                            borderRadius: '10px',
                                            fontSize: '0.8rem',
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: '0.5rem'
                                        }}>
                                            <div className="status-col">
                                                <strong style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Employer Side</strong>
                                                <div style={{ color: app.employerRated ? '#10b981' : '#ef4444' }}>
                                                    {app.employerRated ? '✓ Rated' : '✗ Not Rated'}
                                                </div>
                                                <div style={{ color: app.employerWorkConfirmed ? '#10b981' : '#ef4444' }}>
                                                    {app.employerWorkConfirmed ? '✓ Work Done' : '✗ Work Pending'}
                                                </div>
                                                <div style={{ color: app.employerPaidStatus ? '#10b981' : '#ef4444' }}>
                                                    {app.employerPaidStatus ? '✓ Payment Sent' : '✗ Payment Pending'}
                                                </div>
                                            </div>
                                            <div className="status-col">
                                                <strong style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Employee Side</strong>
                                                <div style={{ color: app.employeeRated ? '#10b981' : '#ef4444' }}>
                                                    {app.employeeRated ? '✓ Rated' : '✗ Not Rated'}
                                                </div>
                                                <div style={{ color: app.employeeWorkConfirmed ? '#10b981' : '#ef4444' }}>
                                                    {app.employeeWorkConfirmed ? '✓ Work Done' : '✗ Work Pending'}
                                                </div>
                                                <div style={{ color: app.employeePaidStatus ? '#10b981' : '#ef4444' }}>
                                                    {app.employeePaidStatus ? '✓ Payment Received' : '✗ Not Received'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dual Confirmation Status Badges */}
                                        <div className="dual-status-badges" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            {app.employerRated && app.employeeRated ? (
                                                <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <FaCheckCircle /> Mutual Rating Done
                                                </span>
                                            ) : null}
                                            {app.employerWorkConfirmed && app.employeeWorkConfirmed ? (
                                                <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <FaCheckCircle /> Work Verified
                                                </span>
                                            ) : null}
                                            {app.employerPaidStatus && app.employeePaidStatus ? (
                                                <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                    <FaCheckCircle /> Payment Verified
                                                </span>
                                            ) : null}
                                        </div>

                                        <button 
                                            className="btn btn-sm btn-outline" 
                                            style={{ marginTop: '1rem' }}
                                            onClick={() => navigate(`/dashboard/employers/${app.employerId}`)}
                                        >
                                            Employer Profile
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="section-card">
                    <h3><FaBriefcase /> Shortlisted Roles</h3>
                    <div className="scroll-list">
                        {shortlistedJobs.length === 0 ? (
                            <p className="empty-text">No shortlisted jobs.</p>
                        ) : (
                            shortlistedJobs.map((app, i) => (
                                <div key={i} className="list-item" style={{ borderLeft: '4px solid #3b82f6' }}>
                                    <div className="item-header">
                                        <h4>{app.jobTitle}</h4>
                                        <span className="status-pill under_review">SHORTLISTED</span>
                                    </div>
                                    <div className="item-meta">
                                        <span>Employer: {app.employerName}</span>
                                        <span>Date: {new Date(app.appliedDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="section-card">
                    <h3><FaBriefcase /> Application History</h3>
                    <div className="scroll-list">
                        {applications.length === 0 ? (
                            <p className="empty-text">No applications yet.</p>
                        ) : (
                            applications.map((app, i) => (
                                <div key={i} className="list-item">
                                    <div className="item-header">
                                        <h4>{app.jobTitle}</h4>
                                        <span className={`status-pill ${app.status.toLowerCase()}`}>{app.status}</span>
                                    </div>
                                    <div className="item-meta">
                                        <span>Employer: {app.employerName}</span>
                                        <span>Date: {new Date(app.appliedDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section className="section-card full-width">
                    <h3><FaMoneyBillWave /> Transaction Logs</h3>
                    <div className="scroll-list">
                        {paymentHistory.length === 0 ? <p className="empty-text">No payment history found.</p> : (
                            <div className="hired-grid">
                                {paymentHistory.map((txn, i) => (
                                    <div key={i} className="list-item">
                                        <div className="item-header">
                                            <h4 style={{ color: 'var(--accent-color)' }}>₹{txn.amount.toLocaleString()}</h4>
                                            <span className={`status-pill ${txn.status.toLowerCase()}`}>{txn.status}</span>
                                        </div>
                                        <div className="item-meta">
                                            <span>Type: {txn.type.replace(/_/g, ' ')}</span>
                                            <span>Job: {txn.relatedJob?.title || 'Platform'}</span>
                                            <span>Date: {new Date(txn.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default EmployeeDetails;
