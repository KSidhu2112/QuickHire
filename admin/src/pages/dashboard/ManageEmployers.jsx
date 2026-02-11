import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ManageEmployers = () => {
    const [employers, setEmployers] = useState([]);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const fetchEmployers = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    params: {
                        search: debouncedSearch
                    }
                };

                // Fetch data from backend
                const res = await axios.get('http://localhost:5000/api/admin/employers', config);

                if (res.data.success) {
                    setEmployers(res.data.data);
                } else {
                    setError('Failed to fetch employers');
                }
            } catch (err) {
                console.error('Error fetching employers:', err);
                setError(err.response?.data?.message || 'Error fetching data');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployers();
    }, [debouncedSearch]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this employer? All their jobs and applications will be deleted. This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            await axios.delete(`http://localhost:5000/api/admin/users/${id}`, config);
            setEmployers(employers.filter(emp => emp._id !== id));
        } catch (err) {
            console.error('Error deleting employer:', err);
            alert('Failed to delete employer');
        }
    };

    const handleViewDetails = (employerId) => {
        navigate(`/dashboard/employers/${employerId}`);
    };

    if (loading) return <div className="container dashboard-container">Loading...</div>;
    if (error) return <div className="container dashboard-container">Error: {error}</div>;

    return (
        <div className="container dashboard-container">
            <header className="dashboard-header">
                <h2>Manage Employers</h2>
            </header>

            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search by company, name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border-color)',
                        width: '100%',
                        maxWidth: '400px'
                    }}
                />
            </div>

            <div className="recent-activity">
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>ID</th>
                            <th style={{ padding: '1rem' }}>Company Name</th>
                            <th style={{ padding: '1rem' }}>Email</th>
                            <th style={{ padding: '1rem' }}>Industry</th>
                            <th style={{ padding: '1rem' }}>Location</th>
                            <th style={{ padding: '1rem' }}>Joined Date</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employers.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '1rem', textAlign: 'center' }}>No employers found</td></tr>
                        ) : (
                            employers.map(emp => (
                                <tr key={emp._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>{emp._id.substring(0, 8)}...</td>
                                    <td style={{ padding: '1rem' }}>{emp.profile?.company || emp.name}</td>
                                    <td style={{ padding: '1rem' }}>{emp.email}</td>
                                    <td style={{ padding: '1rem' }}>{emp.profile?.businessType || 'N/A'}</td>
                                    <td style={{ padding: '1rem' }}>{emp.profile?.location || 'N/A'}</td>
                                    <td style={{ padding: '1rem' }}>{new Date(emp.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            className="btn btn-outline"
                                            style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                                            onClick={() => handleViewDetails(emp._id)}
                                        >
                                            Details
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            style={{
                                                fontSize: '0.8rem',
                                                padding: '0.5rem',
                                                marginLeft: '0.5rem',
                                                backgroundColor: '#fee2e2',
                                                color: '#dc2626',
                                                border: '1px solid #dc2626'
                                            }}
                                            onClick={() => handleDelete(emp._id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageEmployers;
