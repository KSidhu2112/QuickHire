import { useState, useEffect } from 'react';
import { loadScript } from '../../utils/loadScript';
import { useNavigate } from 'react-router-dom';
import { verificationAPI, disputeAPI, paymentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import './Verification.css';

const EmployeeVerification = () => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [selectedApp, setSelectedApp] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showTimelineModal, setShowTimelineModal] = useState(false);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [timeline, setTimeline] = useState([]);
    const [confirmData, setConfirmData] = useState({ status: 'FULL_PAYMENT', rating: 5, feedback: '' });
    const [disputeData, setDisputeData] = useState({ reason: 'NON_PAYMENT', description: '' });
    const [file, setFile] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitData, setSubmitData] = useState({ notes: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchVerifications();
    }, [filter]);

    const fetchVerifications = async () => {
        try {
            setLoading(true);
            const params = {};
            if (filter !== 'all') params.status = filter;
            const res = await verificationAPI.getEmployeeVerifications(params);
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

    const handleStartWork = async (app) => {
        try {
            const res = await verificationAPI.startWork(app._id);
            if (res.success) {
                toast.success('Work started! Timeline recorded.');
                fetchVerifications();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to start work');
        }
    };

    const handleSubmitWork = async () => {
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
                notes: submitData.notes,
                proofs: uploadedUrls
            };

            const res = await verificationAPI.submitWork(selectedApp._id, data);
            if (res.success) {
                toast.success('Work submitted successfully!');
                setShowSubmitModal(false);
                setFile(null);
                setSubmitData({ notes: '' });
                fetchVerifications();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit work');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmPayment = async () => {
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

            const res = await verificationAPI.employeeConfirm(selectedApp._id, data);
            if (res.success) {
                toast.success('Payment confirmation submitted!');
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
        if (app.workStatus === 'SUBMITTED') return <span className="v-badge v-waiting">⏳ Submitted</span>;
        if (app.workStatus === 'IN_PROGRESS') return <span className="v-badge v-progress">🔨 In Progress</span>;
        if (app.employeeConfirmation?.confirmed && !app.employerConfirmation?.confirmed)
            return <span className="v-badge v-waiting">⏳ Waiting Employer</span>;
        if (!app.employeeConfirmation?.confirmed && app.employerConfirmation?.confirmed)
            return <span className="v-badge v-action">🔔 Action Required</span>;
        return <span className="v-badge v-pending">⏳ Pending</span>;
    };

    const getPaymentBadge = (app) => {
        const statusMap = {
            'HELD_IN_ESCROW': <span className="v-badge v-escrow">🔒 In Escrow</span>,
            'RELEASED': <span className="v-badge v-completed">💰 Released</span>,
            'REFUNDED': <span className="v-badge v-refunded">↩️ Refunded</span>,
            'DISPUTED': <span className="v-badge v-disputed">⚠️ Disputed</span>,
            'PENDING': <span className="v-badge v-pending">⏳ Pending</span>,
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
                    <button className="v-back-btn" onClick={() => navigate('/employee/dashboard')}>← Back</button>
                    <div style={{ flex: 1 }}>
                        <h1>💼 My Work & Payment Verification</h1>
                        <p>Confirm payments received, start work, and track job status</p>
                    </div>
                    <button
                        className="v-btn v-btn-primary"
                        style={{ background: '#f59e0b', padding: '12px 24px', borderRadius: '12px' }}
                        onClick={async () => {
                            try {
                                const orderRes = await paymentAPI.createVerificationOrder();
                                const options = {
                                    key: orderRes.key,
                                    amount: orderRes.order.amount,
                                    currency: 'INR',
                                    name: 'QuickHire Verification',
                                    description: 'Profile Verification Fee',
                                    order_id: orderRes.order.id,
                                    handler: async (response) => {
                                        const verifyRes = await paymentAPI.verifyVerificationPayment(response);
                                        if (verifyRes.success) {
                                            toast.success('Your profile is now VERIFIED! Trust score increased.');
                                            window.location.reload();
                                        }
                                    },
                                    theme: { color: '#f59e0b' },
                                    config: {
                                        display: {
                                            blocks: {
                                                upi: {
                                                    name: "Pay via UPI (PhonePe, Paytm, GPay)",
                                                    instruments: [{ method: "upi" }]
                                                },
                                                wallets: {
                                                    name: "Digital Wallets",
                                                    instruments: [{ method: "wallet" }]
                                                }
                                            },
                                            sequence: ["block.upi", "block.wallets"],
                                            preferences: {
                                                show_default_blocks: true
                                            }
                                        }
                                    }
                                };
                                const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
                                if (!res) {
                                    toast.error('Razorpay SDK failed to load');
                                    return;
                                }
                                const rzp = new window.Razorpay(options);
                                rzp.open();
                            } catch (error) {
                                toast.error('Failed to initiate verification payment');
                            }
                        }}
                    >
                        ⭐ Verify Profile (₹99)
                    </button>
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

                {/* Applications */}
                {applications.length === 0 ? (
                    <div className="v-empty">
                        <span className="v-empty-icon">📭</span>
                        <h2>No Verifications Found</h2>
                        <p>When you're hired for jobs, your verification status will appear here.</p>
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
                                        <div className="v-avatar v-avatar-employer">{app.employer?.name?.charAt(0) || '?'}</div>
                                        <div>
                                            <strong>Employer: {app.employer?.name}</strong>
                                            <p>{app.employer?.email}</p>
                                            {app.employer?.trustScore !== undefined && (
                                                <span className={`v-trust ${app.employer.trustScore >= 70 ? 'v-trust-good' : app.employer.trustScore >= 40 ? 'v-trust-ok' : 'v-trust-low'}`}>
                                                    Trust: {app.employer.trustScore}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="v-confirmations">
                                        <div className={`v-confirm-box ${app.employerConfirmation?.confirmed ? 'v-confirmed' : ''}`}>
                                            <span className="v-confirm-icon">{app.employerConfirmation?.confirmed ? '✅' : '⬜'}</span>
                                            <span>Employer Confirmation</span>
                                            {app.employerConfirmation?.confirmed && (
                                                <small>Status: {app.employerConfirmation.status}</small>
                                            )}
                                        </div>
                                        <div className="v-confirm-separator">⟷</div>
                                        <div className={`v-confirm-box ${app.employeeConfirmation?.confirmed ? 'v-confirmed' : ''}`}>
                                            <span className="v-confirm-icon">{app.employeeConfirmation?.confirmed ? '✅' : '⬜'}</span>
                                            <span>Your Confirmation</span>
                                            {app.employeeConfirmation?.confirmed && (
                                                <small>Status: {app.employeeConfirmation.status}</small>
                                            )}
                                        </div>
                                    </div>

                                    {app.escrowAmount > 0 && (
                                        <div className="v-escrow-info">
                                            <span>🔒 Escrow: ₹{app.escrowAmount.toLocaleString()}</span>
                                            <span className="v-escrow-note">Secured — released after both confirm</span>
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
                                                    <a key={i} href={`http://localhost:5000${url}`} target="_blank" rel="noopener noreferrer" className="v-proof-link">📄 View Proof {i + 1}</a>
                                                ))}
                                            </div>
                                            <small className="v-date">Submitted: {new Date(app.workSubmission.submittedAt).toLocaleString()}</small>
                                        </div>
                                    )}
                                </div>

                                <div className="v-card-actions">
                                    {app.workStatus === 'PENDING' && (
                                        <button className="v-btn v-btn-start" onClick={() => handleStartWork(app)}>
                                            🚀 Start Work
                                        </button>
                                    )}
                                    {app.workStatus === 'IN_PROGRESS' && (
                                        <button className="v-btn v-btn-primary" onClick={() => { setSelectedApp(app); setShowSubmitModal(true); }}>
                                            ✅ Mark Completed
                                        </button>
                                    )}
                                    {!app.employeeConfirmation?.confirmed && app.workStatus !== 'COMPLETED' && app.workStatus !== 'DISPUTED' && app.workStatus !== 'PENDING' && (
                                        <button className="v-btn v-btn-primary" onClick={() => { setSelectedApp(app); setShowConfirmModal(true); }}>
                                            💰 Confirm Payment
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

            {/* Confirm Payment Modal */}
            {showConfirmModal && selectedApp && (
                <div className="v-modal-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="v-modal" onClick={e => e.stopPropagation()}>
                        <button className="v-modal-close" onClick={() => setShowConfirmModal(false)}>✕</button>
                        <h2>💰 Confirm Payment Received</h2>
                        <p className="v-modal-sub">For: {selectedApp.job?.title} — {selectedApp.employer?.name}</p>

                        <div className="v-form-group">
                            <label>Payment Status</label>
                            <select value={confirmData.status} onChange={e => setConfirmData({ ...confirmData, status: e.target.value })}>
                                <option value="FULL_PAYMENT">💰 Full Payment Received</option>
                                <option value="PARTIAL_PAYMENT">⚠️ Partial Payment</option>
                                <option value="NOT_PAID">❌ Not Paid</option>
                            </select>
                        </div>

                        <div className="v-form-group">
                            <label>Rate Employer (1-5 Stars)</label>
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
                                placeholder="Share your experience working with this employer..."
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
                            <small>Upload payment receipt screenshot if available.</small>
                        </div>

                        {confirmData.status === 'NOT_PAID' && (
                            <div className="v-warning-box">
                                <p>⚠️ If you select "Not Paid", a dispute may be auto-generated for admin review.</p>
                            </div>
                        )}

                        <button className="v-btn v-btn-primary v-btn-full" onClick={handleConfirmPayment} disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Confirm Payment Status'}
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

            {/* Submit Work Modal */}
            {showSubmitModal && selectedApp && (
                <div className="v-modal-overlay" onClick={() => setShowSubmitModal(false)}>
                    <div className="v-modal" onClick={e => e.stopPropagation()}>
                        <button className="v-modal-close" onClick={() => setShowSubmitModal(false)}>✕</button>
                        <h2>✅ Submit Work Completion</h2>
                        <p className="v-modal-sub">For: {selectedApp.job?.title}</p>

                        <div className="v-form-group">
                            <label>Completion Notes</label>
                            <textarea
                                value={submitData.notes}
                                onChange={e => setSubmitData({ ...submitData, notes: e.target.value })}
                                placeholder="Describe what you completed..."
                                rows="3"
                            />
                        </div>

                        <div className="v-form-group">
                            <label>Upload Work Proof (Photo/Time)</label>
                            <input
                                type="file"
                                accept="image/*,.pdf,.doc,.docx"
                                onChange={e => setFile(e.target.files[0])}
                            />
                            <small>Upload photos of work or timesheet.</small>
                        </div>

                        <button className="v-btn v-btn-primary v-btn-full" onClick={handleSubmitWork} disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Work'}
                        </button>
                    </div>
                </div>
            )}

            {/* Dispute Modal */}
            {showDisputeModal && selectedApp && (
                <div className="v-modal-overlay" onClick={() => setShowDisputeModal(false)}>
                    <div className="v-modal" onClick={e => e.stopPropagation()}>
                        <button className="v-modal-close" onClick={() => setShowDisputeModal(false)}>✕</button>
                        <h2>🚨 Raise a Dispute</h2>
                        <p className="v-modal-sub">Against: {selectedApp.employer?.name} — {selectedApp.job?.title}</p>

                        <div className="v-form-group">
                            <label>Reason</label>
                            <select value={disputeData.reason} onChange={e => setDisputeData({ ...disputeData, reason: e.target.value })}>
                                <option value="NON_PAYMENT">💸 Non-Payment</option>
                                <option value="LATE_PAYMENT">⏰ Late Payment</option>
                                <option value="HARASSMENT">🛑 Harassment</option>
                                <option value="FRAUD">🚫 Fraud</option>
                                <option value="OTHER">📝 Other</option>
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

export default EmployeeVerification;
