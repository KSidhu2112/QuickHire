import React, { useState, useEffect } from 'react';
import axios from 'axios';
const API_BASE = import.meta.env.VITE_API_URL || 'https://quickhire-9ous.onrender.com/api';
import { useNavigate } from 'react-router-dom';

const ManageEmployees = () => {
    const [employees, setEmployees] = useState([]);
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
        const fetchEmployees = async () => {
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
                const res = await axios.get(`${API_BASE}/admin/employees`, config);

                if (res.data.success) {
                    setEmployees(res.data.data);
                } else {
                    setError('Failed to fetch employees');
                }
            } catch (err) {
                console.error('Error fetching employees:', err);
                setError(err.response?.data?.message || 'Error fetching data');
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [debouncedSearch]);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('adminToken');
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            await axios.delete(`${API_BASE}/admin/users/${id}`, config);
            setEmployees(employees.filter(emp => emp._id !== id));
        } catch (err) {
            console.error('Error deleting user:', err);
            alert('Failed to delete user');
        }
    };

    const handleViewDetails = (employeeId) => {
        navigate(`/dashboard/employees/${employeeId}`);
    };

    if (loading) return <div className="container dashboard-container">Loading...</div>;
    if (error) return <div className="container dashboard-container">Error: {error}</div>;

    return (
        <div className="container dashboard-container">
            <header className="dashboard-header">
                <h2>Manage Active Job Seekers</h2>
            </header>

            <div style={{ marginBottom: '1rem' }}>
                <input
                    type="text"
                    placeholder="Search by name or email..."
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
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>Email</th>
                            <th style={{ padding: '1rem' }}>Role/Skill</th>
                            <th style={{ padding: '1rem' }}>Verify Status</th>
                            <th style={{ padding: '1rem' }}>Joined Date</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.length === 0 ? (
                            <tr><td colSpan="7" style={{ padding: '1rem', textAlign: 'center' }}>No job seekers found</td></tr>
                        ) : (
                            employees.map(emp => (
                                <tr key={emp._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '1rem' }}>{emp._id.substring(0, 8)}...</td>
                                    <td style={{ padding: '1rem' }}>{emp.name}</td>
                                    <td style={{ padding: '1rem' }}>{emp.email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        {emp.profile?.skills && emp.profile.skills.length > 0
                                            ? emp.profile.skills.slice(0, 2).join(', ') + (emp.profile.skills.length > 2 ? '...' : '')
                                            : 'N/A'
                                        }
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '0.25rem',
                                            backgroundColor: emp.isEmailVerified ? 'var(--success-color)' : 'orange',
                                            color: 'white',
                                            fontSize: '0.8rem'
                                        }}>
                                            {emp.isEmailVerified ? 'Verified' : 'Pending'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{new Date(emp.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <button 
                                            className="btn btn-outline" 
                                            style={{ fontSize: '0.8rem', padding: '0.5rem', marginRight: '0.5rem' }}
                                            onClick={() => handleViewDetails(emp._id)}
                                        >
                                            Details
                                        </button>
                                        <button
                                            className="btn btn-danger"
                                            style={{
                                                fontSize: '0.8rem',
                                                padding: '0.5rem',
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

export default ManageEmployees;
