import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

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

    if (loading) return <div className="container dashboard-container">Loading...</div>;
    if (error) return <div className="container dashboard-container">Error: {error}</div>;
    if (!details) return <div className="container dashboard-container">No details found.</div>;

    const { employer, jobs, hiredEmployees } = details;

    return (
        <div className="container dashboard-container">
            <header className="dashboard-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button onClick={() => navigate('/dashboard/employers')} className="btn btn-outline">
                    &larr; Back
                </button>
                <h2>{employer.profile?.company || employer.name}</h2>
            </header>

            <div className="employer-info" style={{ marginBottom: '2rem' }}>
                <p style={{ color: 'var(--text-secondary)' }}><strong>Email:</strong> {employer.email}</p>
                <p style={{ color: 'var(--text-secondary)' }}><strong>Industry:</strong> {employer.profile?.businessType || 'N/A'}</p>
                <p style={{ color: 'var(--text-secondary)' }}><strong>Location:</strong> {employer.profile?.location || 'N/A'}</p>
                <p style={{ color: 'var(--text-secondary)' }}><strong>Joined:</strong> {new Date(employer.createdAt).toLocaleDateString()}</p>
            </div>

            <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Left Column: Jobs */}
                <div>
                    <h3 style={{ borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        Posted Jobs ({jobs.length})
                    </h3>

                    {jobs.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No jobs posted yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {jobs.map(job => (
                                <div key={job._id} style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    backgroundColor: 'var(--background-color)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{job.title}</h4>
                                        <span style={{
                                            fontSize: '0.8rem',
                                            padding: '0.2rem 0.5rem',
                                            borderRadius: '4px',
                                            backgroundColor: job.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2',
                                            color: job.status === 'ACTIVE' ? '#166534' : '#991b1b',
                                            fontWeight: '600'
                                        }}>
                                            {job.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Type: {job.jobType.replace('_', ' ')}</span>
                                        <span>Apps: {job.applicants}</span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                                        Posted: {new Date(job.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column: Hired Employees */}
                <div>
                    <h3 style={{ borderBottom: '2px solid var(--success-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
                        Hired Employees ({hiredEmployees.length})
                    </h3>

                    {hiredEmployees.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)' }}>No employees hired yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '600px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                            {hiredEmployees.map((emp, index) => (
                                <div key={emp._id || index} style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'center',
                                    backgroundColor: 'var(--background-color)'
                                }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        backgroundColor: 'var(--primary-color)', color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 'bold', fontSize: '1rem', flexShrink: 0
                                    }}>
                                        {emp.name ? emp.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name || 'Unknown User'}</h4>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{emp.email}</p>
                                        <div style={{ fontSize: '0.8rem', backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block', color: '#1f2937' }}>
                                            Hired for: <strong>{emp.hiredForJob}</strong>
                                        </div>
                                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            Hired on: {new Date(emp.hiredDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployerDetails;
