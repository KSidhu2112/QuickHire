import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUserShield, FaTrash, FaCheckCircle, FaBan, FaSearch, FaEye } from 'react-icons/fa';
import './UserManagement.css';

const UserManagement = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('jobseeker');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.get(`http://localhost:5000/api/admin/${activeTab === 'jobseeker' ? 'employees' : 'employers'}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (userId, newStatus) => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.patch(`http://localhost:5000/api/admin/users/${userId}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
                alert(`User status updated to ${newStatus}`);
            }
        } catch (err) {
            alert('Status update failed');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action is irreversible.')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setUsers(users.filter(u => u._id !== userId));
                alert('User deleted successfully');
            }
        } catch (err) {
            alert('Delete failed');
        }
    };

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="user-mgmt-container">
            <header className="page-header">
                <h1 className="page-title">User Management</h1>
                <div className="search-bar">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="tab-control">
                <button
                    className={activeTab === 'jobseeker' ? 'tab-btn active' : 'tab-btn'}
                    onClick={() => setActiveTab('jobseeker')}
                >
                    Job Seekers (Employees)
                </button>
                <button
                    className={activeTab === 'employer' ? 'tab-btn active' : 'tab-btn'}
                    onClick={() => setActiveTab('employer')}
                >
                    Employers
                </button>
            </div>

            <div className="user-table-wrapper card">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>User Info</th>
                            <th>Role</th>
                            <th>Joined</th>
                            <th>Trust Score</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="table-loader">Loading users...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                            <tr><td colSpan="6" className="empty-state">No users found.</td></tr>
                        ) : filteredUsers.map(user => (
                            <tr key={user._id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar">{user.name.charAt(0)}</div>
                                        <div>
                                            <strong>{user.name}</strong>
                                            <span>{user.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td><span className="badge-role">{user.role}</span></td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <div className="trust-meter">
                                        <div className="trust-bar" style={{ width: `${user.trustScore || 100}%`, background: user.trustScore < 40 ? '#ef4444' : '#10b981' }}></div>
                                        <span>{user.trustScore || 100}%</span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`status-pill ${user.status}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-btns">
                                        <button className="action-btn view" onClick={() => navigate(`/dashboard/${activeTab === 'jobseeker' ? 'employees' : 'employers'}/${user._id}`)} title="View Profile">
                                            <FaEye />
                                        </button>
                                        {user.status === 'active' ? (
                                            <button className="action-btn ban" onClick={() => handleStatusUpdate(user._id, 'suspended')} title="Suspend">
                                                <FaBan />
                                            </button>
                                        ) : (
                                            <button className="action-btn activate" onClick={() => handleStatusUpdate(user._id, 'active')} title="Activate">
                                                <FaCheckCircle />
                                            </button>
                                        )}
                                        <button className="action-btn delete" onClick={() => handleDeleteUser(user._id)} title="Delete">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
