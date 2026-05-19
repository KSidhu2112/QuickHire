import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verificationAPI, disputeAPI } from '../../services/api';
const BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://quickhire-9ous.onrender.com/api').replace('/api', '');
import { toast } from 'react-toastify';
import './Verification.css';

const EmployerVerification = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedApp, setSelectedApp] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showEscrowModal, setShowEscrowModal] = useState(false);
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [timeline, setTimeline] = useState([]);
    const [confirmData, setConfirmData] = useState({ status: 'FULL', rating: 5, feedback: '' });
    const [escrowAmount, setEscrowAmount] = useState('');
    const [disputeData, setDisputeData] = useState({ reason: 'NO_SHOW', description: '' });
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchVerifications();
    }, [filter]);

    const fetchVerifications = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter !== 'all') params.status = filter;
            const res = await verificationAPI.getEmployerVerifications(params);
            if (res.success) {
                setApplications(res.applications);
            }
        } catch (err) {
            console.error('Error:', err);
            toast.error('Failed to load verifications');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmWork = async () => {
        if (!selectedApp) return;
        setSubmitting(true);
        try {
            let uploadedUrls = [];
            if (file) {
                const uploadRes = await verificationAPI.uploadFile(file);
                if (uploadRes.success) {
                    uploadedUrls.push(uploadRes.filePath);
                }
            }

            const data = {
                ...confirmData,
                proof: uploadedUrls
            };

            const res = await verificationAPI.employerConfirm(selectedApp._id, data);
            if (res.success) {
                toast.success('Work completion confirmed!');
                setShowConfirmModal(false);
                setFile(null);
                fetchVerifications();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to confirm');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLockEscrow = async () => {
        if (!selectedApp || !escrowAmount) return;
        setSubmitting(true);
        try {
            const res = await verificationAPI.lockEscrow(selectedApp._id, parseFloat(escrowAmount));
            if (res.success) {
                toast.success(`₹${escrowAmount} locked in escrow!`);
                setShowEscrowModal(false);
                setEscrowAmount('');
                fetchVerifications();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to lock escrow');
        } finally {
            setSubmitting(false);
        }
    };

    const handleViewTimeline = async (app) => {
        try {
            const res = await verificationAPI.getTimeline(app._id);
            if (res.success) {
                setTimeline(res.timeline);
                setSelectedApp(app);
                setShowTimelineModal(true);
            }
        } catch (err) {
            toast.error('Failed to load timeline');
        }
    };

    const handleRaiseDispute = async () => {
        if (!selectedApp) return;
        setSubmitting(true);
        try {
            const res = await disputeAPI.raiseDispute({
                applicationId: selectedApp._id,
                ...disputeData,
            });
            if (res.success) {
                toast.success('Dispute raised successfully');
                setShowDisputeModal(false);
                fetchVerifications();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to raise dispute');
        } finally {
            setSubmitting(false);
        }
    };

    const getStatusBadge = (app) => {
        if (app.workStatus === 'COMPLETED') return <span className="v-badge v-completed">✅ Completed</span>;
        if (app.workStatus === 'DISPUTED') return <span className="v-badge v-disputed">⚠️ Disputed</span>;
        if (app.workStatus === 'SUBMITTED') return <span className="v-badge v-action">🔔 Work Submitted</span>;
        if (app.workStatus === 'IN_PROGRESS') return <span className="v-badge v-progress">🔨 In Progress</span>;
        if (app.employerConfirmation?.confirmed && !app.employeeConfirmation?.confirmed)
            return <span className="v-badge v-waiting">⏳ Waiting Employee</span>;
        if (!app.employerConfirmation?.confirmed && app.employeeConfirmation?.confirmed)
            return <span className="v-badge v-action">🔔 Action Required</span>;
        return <span className="v-badge v-pending">⏳ Pending</span>;
    };

    const getPaymentBadge = (app) => {
        const statusMap = {
            'HELD_IN_ESCROW': <span className="v-badge v-escrow">🔒 In Escrow</span>,
            'RELEASED': <span className="v-badge v-completed">💰 Released</span>,
            'REFUNDED': <span className="v-badge v-refunded">↩️ Refunded</span>,
            'DISPUTED': <span className="v-badge v-disputed">⚠️ Disputed</span>,
            'PENDING': <span className="v-badge v-pending">⏳ Not Locked</span>,
        };
        return statusMap[app.paymentStatus] || <span className="v-badge v-pending">⏳ Pending</span>;
    };

    if (loading) {
        return (
            <div className="verification-page">
                <div className="verification-container">
                    <div className="v-loading">
                        <div className="v-spinner"></div>
                        <p>Loading verifications...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="verification-page">
            <div className="verification-container">
                <div className="v-header">
                    <button className="v-back-btn" onClick={() => navigate('/employer/dashboard')}>← Back</button>
                    <div>
                        <h1>🔐 Work & Payment Verification</h1>
                        <p>Confirm work completion, manage escrow, and track payment status</p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="v-filters">
                    {['all', 'pending', 'completed', 'disputed'].map(f => (
                        <button
                            key={f}
                            className={`v-filter-btn ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' ? '📋 All' : f === 'pending' ? '⏳ Pending' : f === 'completed' ? '✅ Completed' : '⚠️ Disputed'}
                        </button>
                    ))}
                </div>

                {/* Applications List */}
                {applications.length === 0 ? (
                    <div className="v-empty">
                        <span className="v-empty-icon">📭</span>
                        <h2>No Verifications Found</h2>
                        <p>When employees are hired, their verification status will appear here.</p>
                    </div>
                ) : (
                    <div className="v-cards">
                        {applications.map(app => (
                            <div key={app._id} className={`v-card ${app.workStatus === 'DISPUTED' ? 'v-card-disputed' : ''}`}>
                                <div className="v-card-header">
                                    <div className="v-card-info">
                                        <h3>{app.job?.title || 'Job'}</h3>
                                        <span className="v-company">{app.job?.company}</span>
                                    </div>
                                    <div className="v-badges">
                                        {getStatusBadge(app)}
                                        {getPaymentBadge(app)}
                                    </div>
                                </div>

                                <div className="v-card-body">
                                    <div className="v-worker-info">
                                        <div className="v-avatar">{app.jobseeker?.name?.charAt(0) || '?'}</div>
                                        <div>
                                            <strong>{app.jobseeker?.name}</strong>
                                            <p>{app.jobseeker?.email}</p>
                                            {app.jobseeker?.trustScore !== undefined && (
                                                <span className={`v-trust ${app.jobseeker.trustScore >= 70 ? 'v-trust-good' : app.jobseeker.trustScore >= 40 ? 'v-trust-ok' : 'v-trust-low'}`}>
                                                    Trust: {app.jobseeker.trustScore}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="v-confirmations">
                                        <div className={`v-confirm-box ${app.employerConfirmation?.confirmed ? 'v-confirmed' : ''}`}>
                                            <span className="v-confirm-icon">{app.employerConfirmation?.confirmed ? '✅' : '⬜'}</span>
                                            <span>Your Confirmation</span>
                                            {app.employerConfirmation?.confirmed && (
                                                <small>Status: {app.employerConfirmation.status}</small>
                                            )}
                                        </div>
                                        <div className="v-confirm-separator">⟷</div>
                                        <div className={`v-confirm-box ${app.employeeConfirmation?.confirmed ? 'v-confirmed' : ''}`}>
                                            <span className="v-confirm-icon">{app.employeeConfirmation?.confirmed ? '✅' : '⬜'}</span>
                                            <span>Employee Confirmation</span>
                                            {app.employeeConfirmation?.confirmed && (
                                                <small>Status: {app.employeeConfirmation.status}</small>
                                            )}
                                        </div>
                                    </div>

                                    {app.escrowAmount > 0 && (
                                        <div className="v-escrow-info">
                                            <span>🔒 Escrow: ₹{app.escrowAmount.toLocaleString()}</span>
                                        </div>
                                    )}

                                    {app.penalty?.applied && (
                                        <div className="v-penalty-info">
                                            <span>⚠️ Penalty: {app.penalty.percentage}% — {app.penalty.reason}</span>
                                        </div>
                                    )}

                                    {app.workSubmission && (
                                        <div className="v-submission-box">
                                            <h4>✅ Work Submitted</h4>
                                            <p>{app.workSubmission.notes}</p>
                                            <div className="v-proofs">
                                                {app.workSubmission.proofs && app.workSubmission.proofs.map((url, i) => (
                                                    <a key={i} href={`${BACKEND_URL}${url}`} target="_blank" rel="noopener noreferrer" className="v-proof-link">📄 View Proof {i + 1}</a>
                                                ))}
                                            </div>
                                            <small className="v-date">Submitted: {new Date(app.workSubmission.submittedAt).toLocaleString()}</small>
                                        </div>
                                    )}
                                </div>

                                <div className="v-card-actions">
                                    {!app.employerConfirmation?.confirmed && app.workStatus !== 'COMPLETED' && app.workStatus !== 'DISPUTED' && (
                                        <button className="v-btn v-btn-primary" onClick={() => { setSelectedApp(app); setShowConfirmModal(true); }}>
                                            ✅ Confirm Work
                                        </button>
                                    )}
                                    {app.paymentStatus === 'PENDING' && app.workStatus !== 'DISPUTED' && (
                                        <button className="v-btn v-btn-escrow" onClick={() => { setSelectedApp(app); setShowEscrowModal(true); }}>
                                            🔒 Lock Escrow
                                        </button>
                                    )}
                                    <button className="v-btn v-btn-outline" onClick={() => handleViewTimeline(app)}>
                                        📜 Timeline
                                    </button>
                                    {app.workStatus !== 'COMPLETED' && app.workStatus !== 'DISPUTED' && (
                                        <button className="v-btn v-btn-danger" onClick={() => { setSelectedApp(app); setShowDisputeModal(true); }}>
                                            🚨 Dispute
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Confirm Work Modal */}
            {showConfirmModal && selectedApp && (
                <div className="v-modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="v-modal" onClick={e => e.stopPropagation()}>
                        <button className="v-modal-close" onClick={() => setShowConfirmModal(false)}>✕</button>
                        <h2>✅ Confirm Work Completion</h2>
                        <p className="v-modal-sub">For: {selectedApp.jobseeker?.name} — {selectedApp.job?.title}</p>

                        <div className="v-form-group">
                            <label>Work Completion Status</label>
                            <select value={confirmData.status} onChange={e => setConfirmData({ ...confirmData, status: e.target.value })}>
                                <option value="FULL">✅ Full Completion</option>
                                <option value="PARTIAL">⚠️ Partial Completion</option>
                                <option value="NO_SHOW">❌ No Show</option>
                            </select>
                        </div>

                        <div className="v-form-group">
                            <label>Rate Employee (1-5 Stars)</label>
                            <div className="v-rating-stars">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                        key={star}
                                        className={`v-star ${star <= confirmData.rating ? 'v-star-filled' : ''}`}
                                        onClick={() => setConfirmData({ ...confirmData, rating: star })}
                                    >★</span>
                                ))}
                            </div>
                        </div>

                        <div className="v-form-group">
                            <label>Feedback</label>
                            <textarea
                                value={confirmData.feedback}
                                onChange={e => setConfirmData({ ...confirmData, feedback: e.target.value })}
                                placeholder="Share your experience..."
                                rows="3"
                            />
                        </div>

                        <div className="v-form-group">
                            <label>Upload Proof (Optional)</label>
                            <input
                                type="file"
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={e => setFile(e.target.files[0])}
                            />
                            <small>Upload completion acceptance document or screenshot.</small>
                        </div>

                        <button className="v-btn v-btn-primary v-btn-full" onClick={handleConfirmWork} disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Confirm Work Completion'}
                        </button>
                    </div>
                </div>
            )}

            {/* Escrow Modal */}
            {showEscrowModal && selectedApp && (
                <div className="v-modal-overlay" onClick={() => setShowEscrowModal(false)}>
                    <div className="v-modal" onClick={e => e.stopPropagation()}>
                        <button className="v-modal-close" onClick={() => setShowEscrowModal(false)}>✕</button>
                        <h2>🔒 Lock Payment in Escrow</h2>
                        <p className="v-modal-sub">For: {selectedApp.job?.title}</p>

                        <div className="v-escrow-visual">
                            <div className="v-escrow-step">👔 Employer</div>
                            <div className="v-escrow-arrow">→ ₹ →</div>
                            <div className="v-escrow-step v-escrow-platform">🏦 QuickHire Escrow</div>
                            <div className="v-escrow-arrow">→ ₹ →</div>
                            <div className="v-escrow-step">👷 Employee</div>
                        </div>

                        <div className="v-form-group">
                            <label>Amount (₹)</label>
                            <input
                                type="number"
                                value={escrowAmount}
                                onChange={e => setEscrowAmount(e.target.value)}
                                placeholder="Enter payment amount"
                                min="1"
                            />
                            {selectedApp.job?.salaryMin && (
                                <small>Job salary range: ₹{selectedApp.job.salaryMin} - ₹{selectedApp.job.salaryMax || 'N/A'}</small>
                            )}
                        </div>

                        <div className="v-info-box">
                            <p>💡 Payment will be securely held and released only after both parties confirm completion.</p>
                        </div>

                        <button className="v-btn v-btn-escrow v-btn-full" onClick={handleLockEscrow} disabled={submitting || !escrowAmount}>
                            {submitting ? 'Locking...' : `Lock ₹${escrowAmount || '0'} in Escrow`}
                        </button>
                    </div>
                </div>
            )}

            {/* Timeline Modal */}
            {showTimelineModal && timeline.length > 0 && (
                <div className="v-modal-overlay" onClick={() => setShowTimelineModal(false)}>
                    <div className="v-modal v-modal-wide" onClick={e => e.stopPropagation()}>
                        <button className="v-modal-close" onClick={() => setShowTimelineModal(false)}>✕</button>
                        <h2>📜 Legal Evidence Timeline</h2>
                        <p className="v-modal-sub">{selectedApp?.job?.title}</p>

                        <div className="v-timeline">
                            {timeline.map((event, idx) => (
                                <div key={idx} className="v-timeline-item">
                                    <div className="v-timeline-dot">{event.icon}</div>
                                    <div className="v-timeline-content">
                                        <strong>{event.event}</strong>
                                        <time>{new Date(event.timestamp).toLocaleString()}</time>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Dispute Modal */}
            {showDisputeModal && selectedApp && (
                <div className="v-modal-overlay" onClick={() => setShowDisputeModal(false)}>
                    <div className="v-modal" onClick={e => e.stopPropagation()}>
                        <button className="v-modal-close" onClick={() => setShowDisputeModal(false)}>✕</button>
                        <h2>🚨 Raise a Dispute</h2>
                        <p className="v-modal-sub">Against: {selectedApp.jobseeker?.name} — {selectedApp.job?.title}</p>

                        <div className="v-form-group">
                            <label>Reason</label>
                            <select value={disputeData.reason} onChange={e => setDisputeData({ ...disputeData, reason: e.target.value })}>
                                <option value="NO_SHOW">No Show</option>
                                <option value="POOR_WORK">Poor Work Quality</option>
                                <option value="FRAUD">Fraud</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>

                        <div className="v-form-group">
                            <label>Description</label>
                            <textarea
                                value={disputeData.description}
                                onChange={e => setDisputeData({ ...disputeData, description: e.target.value })}
                                placeholder="Describe the issue in detail..."
                                rows="4"
                            />
                        </div>

                        <div className="v-warning-box">
                            <p>⚠️ False disputes will affect your trust score. Please provide accurate information.</p>
                        </div>

                        <button className="v-btn v-btn-danger v-btn-full" onClick={handleRaiseDispute} disabled={submitting || !disputeData.description}>
                            {submitting ? 'Raising...' : 'Raise Dispute'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployerVerification;
