import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Monitoring.css';

const Monitoring = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedDispute, setSelectedDispute] = useState(null);
    const [showResolveModal, setShowResolveModal] = useState(false);
    const [resolveData, setResolveData] = useState({
        resolution: 'RELEASE_EMPLOYEE',
        adminComments: '',
        penaltyPercentage: 0,
        isFakeComplaint: false,
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMonitoringData();
    }, []);

    const fetchMonitoringData = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [statsRes, disputesRes] = await Promise.all([
                axios.get('http://localhost:5000/api/disputes/monitoring', config),
                axios.get('http://localhost:5000/api/disputes?limit=50', config),
            ]);

            if (statsRes.data.success) setStats(statsRes.data.data);
            if (disputesRes.data.success) setDisputes(disputesRes.data.data);
        } catch (error) {
            console.error('Error fetching monitoring data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async () => {
        if (!selectedDispute) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.put(
                `http://localhost:5000/api/disputes/${selectedDispute._id}/resolve`,
                resolveData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                alert('Dispute resolved successfully!');
                setShowResolveModal(false);
                fetchMonitoringData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to resolve dispute');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateStatus = async (disputeId, status) => {
        try {
            const token = localStorage.getItem('adminToken');
            await axios.put(
                `http://localhost:5000/api/disputes/${disputeId}/status`,
                { status, comment: `Status updated to ${status} by admin` },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchMonitoringData();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleCheckPenalties = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const res = await axios.post(
                'http://localhost:5000/api/verification/check-penalties',
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                const r = res.data.results;
                alert(`Penalty Check Complete.\nReminders: ${r.reminders}\nPenalties Applied: ${r.penalties}\nAdmin Alerts: ${r.adminAlerts}`);
                fetchMonitoringData();
            }
        } catch (err) {
            alert('Failed to run penalty check');
        }
    };

    if (loading) {
        return (
            <div className="monitoring-page">
                <div className="monitoring-container">
                    <div className="m-loading">
                        <div className="m-spinner"></div>
                        <p>Loading monitoring data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="monitoring-page">
            <div className="monitoring-container">
                <div className="m-header">
                    <button className="m-back-btn" onClick={() => navigate('/dashboard')}>← Dashboard</button>
                    <div className="m-header-info">
                        <h1>🛡️ Verification Monitoring</h1>
                        <p>Track payments, disputes, penalties, and user trust scores</p>
                    </div>
                    <button className="m-action-btn" onClick={handleCheckPenalties}>
                        ⚡ Run Penalty Check
                    </button>
                </div>

                {/* Stats Grid */}
                {stats && (
                    <div className="m-stats-grid">
                        <div className="m-stat-card m-stat-warning">
                            <div className="m-stat-icon">⏳</div>
                            <div className="m-stat-value">{stats.pendingPayments}</div>
                            <div className="m-stat-label">Pending Payments</div>
                        </div>
                        <div className="m-stat-card m-stat-danger">
                            <div className="m-stat-icon">⚠️</div>
                            <div className="m-stat-value">{stats.openDisputes}</div>
                            <div className="m-stat-label">Open Disputes</div>
                        </div>
                        <div className="m-stat-card m-stat-success">
                            <div className="m-stat-icon">✅</div>
                            <div className="m-stat-value">{stats.resolvedDisputes}</div>
                            <div className="m-stat-label">Resolved</div>
                        </div>
                        <div className="m-stat-card">
                            <div className="m-stat-icon">📊</div>
                            <div className="m-stat-value">{stats.totalDisputes}</div>
                            <div className="m-stat-label">Total Disputes</div>
                        </div>
                        <div className="m-stat-card m-stat-danger">
                            <div className="m-stat-icon">🚫</div>
                            <div className="m-stat-value">{stats.fakeComplaints}</div>
                            <div className="m-stat-label">Fake Complaints</div>
                        </div>
                        <div className="m-stat-card m-stat-warning">
                            <div className="m-stat-icon">💸</div>
                            <div className="m-stat-value">{stats.penaltiesApplied}</div>
                            <div className="m-stat-label">Penalties Applied</div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="m-tabs">
                    {['overview', 'disputes', 'payments', 'flagged'].map(tab => (
                        <button
                            key={tab}
                            className={`m-tab ${activeTab === tab ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'overview' ? '📊 Overview' :
                                tab === 'disputes' ? '⚠️ Disputes' :
                                    tab === 'payments' ? '💰 Payments' :
                                        '🚩 Flagged Users'}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="m-tab-content">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && stats && (
                        <div className="m-overview">
                            {/* Employers with Multiple Complaints */}
                            <div className="m-section">
                                <h3>🔴 Employers with Multiple Complaints</h3>
                                {stats.employerComplaints?.length > 0 ? (
                                    <div className="m-table-wrap">
                                        <table className="m-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Complaints</th>
                                                    <th>Trust Score</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.employerComplaints.map((user, idx) => (
                                                    <tr key={idx}>
                                                        <td>{user.name}</td>
                                                        <td>{user.email}</td>
                                                        <td><span className="m-role-badge">{user.role}</span></td>
                                                        <td><span className="m-count-badge m-count-danger">{user.count}</span></td>
                                                        <td>
                                                            <span className={`m-trust-badge ${user.trustScore >= 70 ? 'm-trust-good' : user.trustScore >= 40 ? 'm-trust-ok' : 'm-trust-low'}`}>
                                                                {user.trustScore}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="m-empty-text">No employers with multiple complaints</p>
                                )}
                            </div>

                            {/* Fake Complaint Users */}
                            <div className="m-section">
                                <h3>🚫 Users with Fake Complaints</h3>
                                {stats.fakeComplaintUsers?.length > 0 ? (
                                    <div className="m-table-wrap">
                                        <table className="m-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Fake Count</th>
                                                    <th>Trust Score</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.fakeComplaintUsers.map((user, idx) => (
                                                    <tr key={idx}>
                                                        <td>{user.name}</td>
                                                        <td>{user.email}</td>
                                                        <td><span className="m-role-badge">{user.role}</span></td>
                                                        <td><span className="m-count-badge m-count-danger">{user.count}</span></td>
                                                        <td>
                                                            <span className={`m-trust-badge ${user.trustScore >= 70 ? 'm-trust-good' : user.trustScore >= 40 ? 'm-trust-ok' : 'm-trust-low'}`}>
                                                                {user.trustScore}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="m-empty-text">No fake complaints detected</p>
                                )}
                            </div>

                            {/* Risky Users */}
                            <div className="m-section">
                                <h3>⚠️ Low Trust Score Users</h3>
                                {stats.riskyUsers?.length > 0 ? (
                                    <div className="m-table-wrap">
                                        <table className="m-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Role</th>
                                                    <th>Trust Score</th>
                                                    <th>Badges</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.riskyUsers.map((user, idx) => (
                                                    <tr key={idx}>
                                                        <td>{user.name}</td>
                                                        <td>{user.email}</td>
                                                        <td><span className="m-role-badge">{user.role}</span></td>
                                                        <td>
                                                            <span className="m-trust-badge m-trust-low">{user.trustScore}%</span>
                                                        </td>
                                                        <td>
                                                            {user.badges?.map((b, i) => (
                                                                <span key={i} className="m-badge-tag">{b}</span>
                                                            ))}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p className="m-empty-text">No users with low trust scores</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Disputes Tab */}
                    {activeTab === 'disputes' && (
                        <div className="m-disputes">
                            {disputes.length === 0 ? (
                                <p className="m-empty-text">No disputes found</p>
                            ) : (
                                <div className="m-dispute-list">
                                    {disputes.map(dispute => (
                                        <div key={dispute._id} className={`m-dispute-card ${dispute.status === 'OPEN' ? 'm-dispute-open' : dispute.status === 'RESOLVED' ? 'm-dispute-resolved' : ''}`}>
                                            <div className="m-dispute-header">
                                                <div>
                                                    <h4>{dispute.job?.title || 'Job'}</h4>
                                                    <p className="m-dispute-meta">
                                                        Raised by: <strong>{dispute.raisedBy?.name}</strong> against <strong>{dispute.against?.name}</strong>
                                                    </p>
                                                </div>
                                                <div className="m-dispute-badges">
                                                    <span className={`m-status-badge m-status-${dispute.status?.toLowerCase()}`}>
                                                        {dispute.status}
                                                    </span>
                                                    <span className={`m-priority-badge m-priority-${dispute.priority?.toLowerCase()}`}>
                                                        {dispute.priority}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="m-dispute-body">
                                                <div className="m-dispute-reason">
                                                    <span className="m-label">Reason:</span>
                                                    <span className="m-value">{dispute.reason?.replace(/_/g, ' ')}</span>
                                                </div>
                                                <p className="m-dispute-desc">{dispute.description}</p>

                                                {dispute.isAutoGenerated && (
                                                    <span className="m-auto-badge">🤖 Auto-Generated</span>
                                                )}
                                                {dispute.isFakeComplaint && (
                                                    <span className="m-fake-badge">🚫 Marked Fake</span>
                                                )}

                                                <div className="m-dispute-trust">
                                                    <span>Raiser Trust: <strong className={dispute.raisedBy?.trustScore >= 70 ? 'm-trust-good' : 'm-trust-low'}>{dispute.raisedBy?.trustScore}%</strong></span>
                                                    <span>Against Trust: <strong className={dispute.against?.trustScore >= 70 ? 'm-trust-good' : 'm-trust-low'}>{dispute.against?.trustScore}%</strong></span>
                                                </div>

                                                <div className="m-dispute-date">
                                                    Created: {new Date(dispute.createdAt).toLocaleString()}
                                                    {dispute.resolvedAt && ` | Resolved: ${new Date(dispute.resolvedAt).toLocaleString()}`}
                                                </div>
                                            </div>

                                            {dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED' && (
                                                <div className="m-dispute-actions">
                                                    {dispute.status === 'OPEN' && (
                                                        <button className="m-btn m-btn-review" onClick={() => handleUpdateStatus(dispute._id, 'UNDER_REVIEW')}>
                                                            📋 Start Review
                                                        </button>
                                                    )}
                                                    <button className="m-btn m-btn-resolve" onClick={() => {
                                                        setSelectedDispute(dispute);
                                                        setResolveData({
                                                            resolution: 'RELEASE_EMPLOYEE',
                                                            adminComments: '',
                                                            penaltyPercentage: 0,
                                                            isFakeComplaint: false,
                                                            penaltyTo: dispute.against?._id,
                                                        });
                                                        setShowResolveModal(true);
                                                    }}>
                                                        ✅ Resolve
                                                    </button>
                                                    <button className="m-btn m-btn-escalate" onClick={() => handleUpdateStatus(dispute._id, 'ESCALATED')}>
                                                        ⬆️ Escalate
                                                    </button>
                                                </div>
                                            )}

                                            {dispute.resolution && (
                                                <div className="m-dispute-resolution">
                                                    <span className="m-label">Resolution:</span>
                                                    <span className="m-value">{dispute.resolution?.replace(/_/g, ' ')}</span>
                                                    {dispute.adminComments && <p className="m-admin-comment">{dispute.adminComments}</p>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pending Payments Tab */}
                    {activeTab === 'payments' && stats && (
                        <div className="m-payments">
                            <h3>💰 Pending Payment Confirmations</h3>
                            {stats.pendingPaymentApps?.length > 0 ? (
                                <div className="m-table-wrap">
                                    <table className="m-table">
                                        <thead>
                                            <tr>
                                                <th>Job</th>
                                                <th>Employer</th>
                                                <th>Employee</th>
                                                <th>Employer Trust</th>
                                                <th>Employee Confirmed</th>
                                                <th>Hours Overdue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.pendingPaymentApps.map((app, idx) => {
                                                const hours = app.employeeConfirmation?.timestamp
                                                    ? Math.round((Date.now() - new Date(app.employeeConfirmation.timestamp).getTime()) / (1000 * 60 * 60))
                                                    : 0;
                                                return (
                                                    <tr key={idx}>
                                                        <td>{app.job?.title}</td>
                                                        <td>{app.employer?.name}</td>
                                                        <td>{app.jobseeker?.name}</td>
                                                        <td>
                                                            <span className={`m-trust-badge ${app.employer?.trustScore >= 70 ? 'm-trust-good' : app.employer?.trustScore >= 40 ? 'm-trust-ok' : 'm-trust-low'}`}>
                                                                {app.employer?.trustScore}%
                                                            </span>
                                                        </td>
                                                        <td>{new Date(app.employeeConfirmation?.timestamp).toLocaleDateString()}</td>
                                                        <td>
                                                            <span className={`m-hours-badge ${hours >= 48 ? 'm-hours-critical' : hours >= 24 ? 'm-hours-warning' : ''}`}>
                                                                {hours}h
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="m-empty-text">No pending payment confirmations</p>
                            )}
                        </div>
                    )}

                    {/* Flagged Users Tab */}
                    {activeTab === 'flagged' && stats && (
                        <div className="m-flagged">
                            <div className="m-section">
                                <h3>🔴 Users with Most Complaints Against Them</h3>
                                {stats.employerComplaints?.length > 0 ? (
                                    <div className="m-user-cards">
                                        {stats.employerComplaints.map((user, idx) => (
                                            <div key={idx} className="m-user-card">
                                                <div className="m-user-avatar">{user.name?.charAt(0)}</div>
                                                <div className="m-user-info">
                                                    <strong>{user.name}</strong>
                                                    <p>{user.email}</p>
                                                    <div className="m-user-stats">
                                                        <span className="m-role-badge">{user.role}</span>
                                                        <span className="m-count-badge m-count-danger">{user.count} complaints</span>
                                                        <span className={`m-trust-badge ${user.trustScore >= 70 ? 'm-trust-good' : user.trustScore >= 40 ? 'm-trust-ok' : 'm-trust-low'}`}>
                                                            Trust: {user.trustScore}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="m-empty-text">No flagged users</p>
                                )}
                            </div>

                            <div className="m-section">
                                <h3>🚫 Users with Fake Complaints History</h3>
                                {stats.fakeComplaintUsers?.length > 0 ? (
                                    <div className="m-user-cards">
                                        {stats.fakeComplaintUsers.map((user, idx) => (
                                            <div key={idx} className="m-user-card m-user-card-danger">
                                                <div className="m-user-avatar m-avatar-danger">{user.name?.charAt(0)}</div>
                                                <div className="m-user-info">
                                                    <strong>{user.name}</strong>
                                                    <p>{user.email}</p>
                                                    <div className="m-user-stats">
                                                        <span className="m-role-badge">{user.role}</span>
                                                        <span className="m-count-badge m-count-danger">{user.count} fake</span>
                                                        <span className="m-trust-badge m-trust-low">Trust: {user.trustScore}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="m-empty-text">No users with fake complaints</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Resolve Dispute Modal */}
            {showResolveModal && selectedDispute && (
                <div className="m-modal-overlay" onClick={() => setShowResolveModal(false)}>
                    <div className="m-modal" onClick={e => e.stopPropagation()}>
                        <button className="m-modal-close" onClick={() => setShowResolveModal(false)}>✕</button>
                        <h2>✅ Resolve Dispute</h2>
                        <p className="m-modal-sub">
                            {selectedDispute.job?.title} — {selectedDispute.reason?.replace(/_/g, ' ')}
                        </p>

                        <div className="m-form-group">
                            <label>Resolution</label>
                            <select value={resolveData.resolution} onChange={e => setResolveData({ ...resolveData, resolution: e.target.value })}>
                                <option value="RELEASE_EMPLOYEE">💰 Release Payment to Employee</option>
                                <option value="REFUND_EMPLOYER">↩️ Refund Employer</option>
                                <option value="SPLIT">⚖️ Split Payment</option>
                                <option value="DISMISSED">❌ Dismiss Dispute</option>
                                <option value="PENALTY_APPLIED">⚠️ Apply Penalty</option>
                            </select>
                        </div>

                        <div className="m-form-group">
                            <label>Admin Comments</label>
                            <textarea
                                value={resolveData.adminComments}
                                onChange={e => setResolveData({ ...resolveData, adminComments: e.target.value })}
                                placeholder="Add your resolution notes..."
                                rows="3"
                            />
                        </div>

                        <div className="m-form-group">
                            <label>Penalty Percentage (0 = none)</label>
                            <input
                                type="number"
                                value={resolveData.penaltyPercentage}
                                onChange={e => setResolveData({ ...resolveData, penaltyPercentage: parseInt(e.target.value) || 0 })}
                                min="0"
                                max="100"
                            />
                        </div>

                        <div className="m-form-group m-checkbox-group">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={resolveData.isFakeComplaint}
                                    onChange={e => setResolveData({ ...resolveData, isFakeComplaint: e.target.checked })}
                                />
                                <span>Mark as Fake Complaint (reduces raiser's trust score by 15)</span>
                            </label>
                        </div>

                        <button className="m-btn m-btn-resolve m-btn-full" onClick={handleResolve} disabled={submitting}>
                            {submitting ? 'Resolving...' : 'Resolve Dispute'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Monitoring;
