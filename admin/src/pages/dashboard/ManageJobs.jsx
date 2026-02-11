import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaSearch, FaEye, FaTrash, FaFilter } from 'react-icons/fa';
import './ManageJobs.css';

const ManageJobs = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [jobTypeFilter, setJobTypeFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalJobs, setTotalJobs] = useState(0);

    useEffect(() => {
        fetchJobs();
    }, [currentPage, statusFilter, jobTypeFilter, searchTerm]);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');

            // Check if token exists
            if (!token) {
                toast.error('Please login to continue');
                window.location.href = '/login';
                return;
            }

            // Build query parameters
            const params = new URLSearchParams({
                page: currentPage,
                limit: 10,
            });

            if (statusFilter !== 'ALL') {
                params.append('status', statusFilter);
            }

            if (jobTypeFilter !== 'ALL') {
                params.append('jobType', jobTypeFilter);
            }

            if (searchTerm) {
                params.append('keyword', searchTerm);
            }

            const response = await fetch(`http://localhost:5000/api/admin/jobs?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                toast.error('Session expired. Please login again.');
                localStorage.removeItem('adminToken');
                window.location.href = '/login';
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setJobs(data.jobs || []);
                setTotalPages(data.pages || 1);
                setTotalJobs(data.total || 0);
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || 'Failed to fetch jobs');
            }
        } catch (error) {
            console.error('Error fetching jobs:', error);
            toast.error('An error occurred while fetching jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteJob = async (jobId) => {
        if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
            return;
        }

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`http://localhost:5000/api/admin/jobs/${jobId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Job deleted successfully');
                fetchJobs(); // Refresh the list
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to delete job');
            }
        } catch (error) {
            console.error('Error deleting job:', error);
            toast.error('An error occurred while deleting the job');
        }
    };

    const handleViewJob = (jobId) => {
        window.open(`http://localhost:5173/jobs/${jobId}`, '_blank');
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString();
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'ACTIVE':
                return 'status-badge status-active';
            case 'CLOSED':
                return 'status-badge status-closed';
            case 'DRAFT':
                return 'status-badge status-draft';
            default:
                return 'status-badge';
        }
    };

    return (
        <div className="container dashboard-container">
            <header className="dashboard-header">
                <h2>Manage Jobs</h2>
                <p className="subtitle">View and manage all job postings on the platform</p>
            </header>

            {/* Filters and Search */}
            <div className="jobs-controls">
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by title, company, or description..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="search-input"
                    />
                </div>

                <div className="filter-group">
                    <FaFilter className="filter-icon" />
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="filter-select"
                    >
                        <option value="ALL">All Status</option>
                        <option value="ACTIVE">Active</option>
                        <option value="CLOSED">Closed</option>
                        <option value="DRAFT">Draft</option>
                    </select>

                    <select
                        value={jobTypeFilter}
                        onChange={(e) => {
                            setJobTypeFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="filter-select"
                    >
                        <option value="ALL">All Types</option>
                        <option value="FULL_TIME">Full Time</option>
                        <option value="PART_TIME">Part Time</option>
                        <option value="CONTRACT">Contract</option>
                        <option value="DAILY">Daily</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="jobs-stats">
                <p>Showing <strong>{jobs.length}</strong> of <strong>{totalJobs}</strong> jobs</p>
            </div>

            {/* Jobs Table */}
            {loading ? (
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading jobs...</p>
                </div>
            ) : jobs.length === 0 ? (
                <div className="no-data">
                    <p>No jobs found</p>
                </div>
            ) : (
                <div className="jobs-table-container">
                    <table className="jobs-table">
                        <thead>
                            <tr>
                                <th>Job Title</th>
                                <th>Company</th>
                                <th>Type</th>
                                <th>Status</th>
                                <th>Location</th>
                                <th>Salary</th>
                                <th>Posted</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(job => (
                                <tr key={job._id}>
                                    <td className="job-title-cell">
                                        <strong>{job.title}</strong>
                                        {job.isUrgent && <span className="urgent-badge">Urgent</span>}
                                    </td>
                                    <td>{job.company}</td>
                                    <td>
                                        <span className="type-badge">
                                            {job.jobType?.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={getStatusBadgeClass(job.status)}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td>{job.location?.city || 'N/A'}</td>
                                    <td>
                                        {job.salaryMin && job.salaryMax
                                            ? `₹${job.salaryMin} - ₹${job.salaryMax}`
                                            : 'Not specified'}
                                    </td>
                                    <td>{formatDate(job.createdAt)}</td>
                                    <td className="actions-cell">
                                        <button
                                            className="action-btn view-btn"
                                            onClick={() => handleViewJob(job._id)}
                                            title="View Job"
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => handleDeleteJob(job._id)}
                                            title="Delete Job"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>
                    <span className="pagination-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        className="pagination-btn"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default ManageJobs;
