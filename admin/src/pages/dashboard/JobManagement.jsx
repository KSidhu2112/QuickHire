import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaTrash, FaCheck, FaTimes, FaExclamationTriangle, FaSearch, FaEye } from 'react-icons/fa';
import './JobManagement.css';

const JobManagement = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');

    useEffect(() => {
        fetchJobs();
    }, [filterStatus]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`http://localhost:5000/api/admin/jobs?status=${filterStatus}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setJobs(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching jobs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (jobId, status) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.patch(`http://localhost:5000/api/admin/jobs/${jobId}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setJobs(jobs.map(j => j._id === jobId ? { ...j, status } : j));
                alert(`Job ${status}`);
            }
        } catch (err) {
            alert('Failed to update job status');
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Delete this job?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.delete(`http://localhost:5000/api/admin/jobs/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setJobs(jobs.filter(j => j._id !== jobId));
                alert('Job deleted');
            }
        } catch (err) {
            alert('Delete failed');
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.employer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="job-mgmt-container">
            <header className="page-header">
                <h1 className="page-title">Job Management</h1>
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search jobs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="filter-bar">
                {['ALL', 'ACTIVE', 'COMPLETED', 'SUSPICIOUS', 'CLOSED'].map(s => (
                    <button
                        key={s}
                        className={filterStatus === s ? 'filter-btn active' : 'filter-btn'}
                        onClick={() => setFilterStatus(s)}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <div className="job-grid">
                {loading ? (
                    <div className="loading-state">Loading Jobs...</div>
                ) : filteredJobs.length === 0 ? (
                    <div className="empty-state">No jobs found in this category.</div>
                ) : filteredJobs.map(job => (
                    <div className="job-admin-card card" key={job._id}>
                        <div className="job-card-header">
                            <span className={`status-tag ${job.status}`}>{job.status}</span>
                            <span className="job-date">{new Date(job.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h3 className="job-title">{job.title}</h3>
                        <div className="job-meta">
                            <span>Posted by: <strong>{job.employer?.name}</strong></span>
                            <span>Salary: <strong>₹{job.salaryMin} - ₹{job.salaryMax} / {job.salaryType?.toLowerCase() || 'monthly'}</strong></span>
                            <span>Vacancies: <strong>{Math.max(0, job.workersRequired - (job.workersHired || 0))}</strong></span>
                        </div>
                        <div className="job-footer">
                            <div className="job-actions">
                                {job.status !== 'ACTIVE' && (
                                    <button className="action-btn check" onClick={() => handleStatusUpdate(job._id, 'ACTIVE')} title="Approve">
                                        <FaCheck />
                                    </button>
                                )}
                                {job.status !== 'SUSPICIOUS' && (
                                    <button className="action-btn flag" onClick={() => handleStatusUpdate(job._id, 'SUSPICIOUS')} title="Mark Suspicious">
                                        <FaExclamationTriangle />
                                    </button>
                                )}
                                <button className="action-btn delete" onClick={() => handleDeleteJob(job._id)} title="Delete">
                                    <FaTrash />
                                </button>
                            </div>
                            <button className="view-btn">View Details <FaEye /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default JobManagement;
