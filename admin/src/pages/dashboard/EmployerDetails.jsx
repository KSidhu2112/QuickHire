import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './DetailPages.css';
import { FaArrowLeft, FaEnvelope, FaBuilding, FaMapMarkerAlt, FaCalendarAlt, FaBriefcase, FaUsers, FaCheckCircle } from 'react-icons/fa';

const EmployerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [details, setDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                };
                const res = await axios.get(`http://localhost:5000/api/admin/employers/${id}`, config);
                if (res.data.success) {
                    setDetails(res.data.data);
                } else {
                    setError('Failed to fetch employer details');
                }
            } catch (err) {
                console.error('Error fetching details:', err);
                setError(err.response?.data?.message || 'Error fetching data');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchDetails();
        }
    }, [id]);

    if (loading) return <div className="details-page-container"><div className="loading-spinner">Loading...</div></div>;
    if (error) return <div className="details-page-container"><div className="error-message">Error: {error}</div></div>;
    if (!details) return <div className="details-page-container"><div className="empty-state">No details found.</div></div>;

    const { employer, jobs, hiredEmployees } = details;

    return (
        <div className="details-page-container">
            <header className="details-header">
                <button onClick={() => navigate('/dashboard/employers')} className="back-btn">
                    <FaArrowLeft /> Back
                </button>
            </header>

            <div className="profile-header-card">
                <div className="profile-main-info">
                    <div className="large-avatar" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                        {employer.profile?.company ? employer.profile.company.charAt(0).toUpperCase() : employer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="info-content">
                        <h1>{employer.profile?.company || employer.name}</h1>
                        <div className="info-grid">
                            <div className="info-item"><FaEnvelope /> {employer.email}</div>
                            <div className="info-item"><FaBuilding /> {employer.profile?.businessType || 'N/A'}</div>
                            <div className="info-item"><FaMapMarkerAlt /> {employer.profile?.location || 'N/A'}</div>
                            <div className="info-item"><FaCalendarAlt /> Joined {new Date(employer.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
                <div className="stats-container">
                    <div className="stat-box">
                        <span>Jobs Posted</span>
                        <strong>{jobs.length}</strong>
                    </div>
                    <div className="stat-box">
                        <span>Hired</span>
                        <strong>{hiredEmployees.length}</strong>
                    </div>
                </div>
            </div>

            <div className="details-grid">
                {/* Posted Jobs Section */}
                <section className="section-card">
                    <h3><FaBriefcase /> Posted Jobs</h3>
                    <div className="scroll-list">
                        {jobs.length === 0 ? (
                            <p className="empty-text">No jobs posted yet.</p>
                        ) : (
                            jobs.map(job => (
                                <div key={job._id} className="list-item">
                                    <div className="item-header">
                                        <h4>{job.title}</h4>
                                        <span className={`status-pill ${job.status === 'ACTIVE' ? 'success' : 'failed'}`}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <div className="item-meta">
                                        <span>Type: {job.jobType.replace('_', ' ')}</span>
                                        <span>Applicants: {job.applicants}</span>
                                        <span>Date: {new Date(job.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Hired Employees Section */}
                <section className="section-card">
                    <h3><FaUsers /> Hired Employees</h3>
                    <div className="scroll-list">
                        {hiredEmployees.length === 0 ? (
                            <p className="empty-text">No employees hired yet.</p>
                        ) : (
                            hiredEmployees.map((emp, index) => (
                                <div key={emp._id || index} className="list-item hired-item">
                                    <div className="item-header">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '12px',
                                                backgroundColor: 'var(--primary-color)', color: 'white',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 'bold', fontSize: '1.2rem'
                                            }}>
                                                {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0 }}>{emp.name || 'Unknown User'}</h4>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{emp.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="item-meta">
                                        <span><strong>Job:</strong> {emp.hiredForJob}</span>
                                        <span><strong>Date:</strong> {new Date(emp.hiredDate).toLocaleDateString()}</span>
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
                                            <div style={{ color: emp.employerRated ? '#10b981' : '#ef4444' }}>
                                                {emp.employerRated ? '✓ Rated' : '✗ Not Rated'}
                                            </div>
                                            <div style={{ color: emp.employerWorkConfirmed ? '#10b981' : '#ef4444' }}>
                                                {emp.employerWorkConfirmed ? '✓ Work Done' : '✗ Work Pending'}
                                            </div>
                                            <div style={{ color: emp.employerPaidStatus ? '#10b981' : '#ef4444' }}>
                                                {emp.employerPaidStatus ? '✓ Payment Sent' : '✗ Payment Pending'}
                                            </div>
                                        </div>
                                        <div className="status-col">
                                            <strong style={{ display: 'block', marginBottom: '0.3rem', color: 'var(--text-secondary)' }}>Employee Side</strong>
                                            <div style={{ color: emp.employeeRated ? '#10b981' : '#ef4444' }}>
                                                {emp.employeeRated ? '✓ Rated' : '✗ Not Rated'}
                                            </div>
                                            <div style={{ color: emp.employeeWorkConfirmed ? '#10b981' : '#ef4444' }}>
                                                {emp.employeeWorkConfirmed ? '✓ Work Done' : '✗ Work Pending'}
                                            </div>
                                            <div style={{ color: emp.employeePaidStatus ? '#10b981' : '#ef4444' }}>
                                                {emp.employeePaidStatus ? '✓ Payment Received' : '✗ Not Received'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dual Confirmation Status Badges */}
                                    <div className="dual-status-badges" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {emp.employerRated && emp.employeeRated ? (
                                            <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <FaCheckCircle /> Mutual Rating Done
                                            </span>
                                        ) : null}
                                        {emp.employerWorkConfirmed && emp.employeeWorkConfirmed ? (
                                            <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <FaCheckCircle /> Work Verified
                                            </span>
                                        ) : null}
                                        {emp.employerPaidStatus && emp.employeePaidStatus ? (
                                            <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <FaCheckCircle /> Payment Verified
                                            </span>
                                        ) : null}
                                    </div>

                                    <div style={{ marginTop: '1rem' }}>
                                        <button 
                                            className="btn btn-sm btn-outline" 
                                            onClick={() => navigate(`/dashboard/employees/${emp._id}`)}
                                        >
                                            View Employee Profile
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default EmployerDetails;
