import React, { useState, useEffect } from 'react';
import { paymentAPI, authAPI } from '../services/api';
import { toast } from 'react-toastify';
import { FaCreditCard, FaUniversity, FaMobileAlt, FaWallet, FaChevronRight } from 'react-icons/fa';
import './PaymentModal.css';
import { loadScript } from '../utils/loadScript';

const PaymentModal = ({ isOpen, onClose, onSuccess, amount = 20, action = 'payment', jobId = null }) => {
    const [selectedTab, setSelectedTab] = useState('UPI');
    const [upiId, setUpiId] = useState('');
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [jobDetails, setJobDetails] = useState(null);
    const [checkingVacancies, setCheckingVacancies] = useState(false);

    useEffect(() => {
        const storedUser = authAPI.getStoredUser();
        setUser(storedUser);
    }, []);

    useEffect(() => {
        const fetchJobInfo = async () => {
            if (isOpen && action === 'apply' && jobId) {
                setCheckingVacancies(true);
                try {
                    const response = await jobAPI.getJobById(jobId);
                    if (response.success) {
                        setJobDetails(response.job);
                    }
                } catch (error) {
                    console.error('Error fetching job details in modal:', error);
                } finally {
                    setCheckingVacancies(false);
                }
            }
        };
        fetchJobInfo();
    }, [isOpen, action, jobId]);

    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const handleRazorpayPayment = async (method = null, vpa = null) => {
        if (action === 'apply' && jobDetails) {
            if (jobDetails.workersHired >= jobDetails.workersRequired) {
                toast.error("This job is already full. No more vacancies left.");
                return;
            }
        }

        setLoading(true);
        try {
            // 1. Create order
            const orderData = await paymentAPI.createOrder({ action, jobId, amount });

            if (!orderData.success) {
                throw new Error(orderData.message || 'Failed to create order');
            }

            const { order, key } = orderData;

            // 2. Open Razorpay checkout
            const razorpayOptions = {
                key: key,
                amount: order.amount,
                currency: "INR",
                name: "QuickHire",
                description: action === 'apply' ? "Job Application Fee" : "Job Posting Fee",
                order_id: order.id,
                handler: async (response) => {
                    try {
                        const verification = await paymentAPI.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verification.success) {
                            onSuccess(verification);
                            onClose();
                        } else {
                            toast.error("Payment verification failed");
                        }
                    } catch (err) {
                        toast.error("Error verifying payment");
                    } finally {
                        setLoading(false);
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                    contact: user?.phone || "",
                    method: method // Pre-select method if provided
                },
                theme: {
                    color: "#1d4ed8"
                },
                config: {
                    display: {
                        blocks: {
                            upi: {
                                name: "Pay via UPI (PhonePe, Paytm, GPay)",
                                instruments: [{ method: "upi" }]
                            },
                            wallets: {
                                name: "Digital Wallets",
                                instruments: [
                                    { method: "wallet" }
                                ]
                            }
                        },
                        sequence: ["block.upi", "block.wallets"],
                        preferences: {
                            show_default_blocks: true
                        }
                    }
                }
            };

            // If a specific UPI app is targetted (simulated here since Razorpay handles the internal redirect)
            // Or if we have a VPA
            if (vpa) {
                // Razorpay doesn't strictly allow pre-filling VPA in standard checkout 
                // but pre-selecting method=upi will open that section.
            }

            const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

            if (!res) {
                toast.error('Razorpay SDK failed to load. Are you online?');
                setLoading(false);
                return;
            }

            const rzp = new window.Razorpay(razorpayOptions);
            rzp.on('payment.failed', function (response) {
                toast.error(response.error.description || "Payment failed");
                setLoading(false);
            });
            rzp.open();
        } catch (error) {
            console.error("Payment error:", error);
            toast.error(error.message || "Failed to initiate payment");
            setLoading(false);
        }
    };

    const upiApps = [
        { name: 'PhonePe', icon: 'https://img.icons8.com/color/48/phone-pe.png', recommended: true },
        { name: 'Google Pay', icon: 'https://img.icons8.com/color/48/google-pay.png', recommended: true },
        { name: 'Paytm', icon: 'https://img.icons8.com/color/48/paytm.png' },
        { name: 'BHIM', icon: 'https://img.icons8.com/color/48/bhim.png' },
        { name: 'Amazon Pay', icon: 'https://img.icons8.com/color/48/amazon-pay.png' }
    ];

    return (
        <div className="rzp-modal-overlay" onClick={handleBackdropClick}>
            <div className="rzp-modal-container">
                <button className="rzp-close-btn" onClick={onClose}>&times;</button>

                {/* Left Side: Summary & User Info */}
                <div className="rzp-modal-left">
                    <div className="rzp-merchant-info">
                        <div className="rzp-logo">QH</div>
                        <div>
                            <h3>QuickHire</h3>
                            <p>Premium Marketplace</p>
                        </div>
                    </div>

                    <div className="rzp-price-summary">
                        <span className="price-label">Amount to Pay</span>
                        <h2 className="price-value">₹{amount}</h2>
                        <div className="price-item">
                            <span>Convenience Fee</span>
                            <span>₹0.00</span>
                        </div>
                        <div className="price-total">
                            <span>Total</span>
                            <span>₹{amount}</span>
                        </div>
                    </div>

                    <div className="rzp-user-info">
                        <h4>Billing Information</h4>
                        <div className="user-detail">
                            <span className="label">User</span>
                            <span className="value">{user?.name || 'N/A'}</span>
                        </div>
                        <div className="user-detail">
                            <span className="label">Email</span>
                            <span className="value">{user?.email || 'N/A'}</span>
                        </div>
                        <div className="user-detail">
                            <span className="label">Contact</span>
                            <span className="value">{user?.phone || 'N/A'}</span>
                        </div>
                    </div>

                    <div className="rzp-modal-footer-left">
                        <p>🛡️ Secured by Razorpay</p>
                    </div>
                </div>

                {/* Right Side: Payment Options */}
                <div className="rzp-modal-right">
                    <div className="rzp-options-header">
                        <h3>Select Payment Method</h3>
                        <p>Choose your preferred way to pay</p>
                    </div>

                    <div className="rzp-vacancy-check-container">
                        {checkingVacancies && (
                            <div className="vacancy-check-loading">
                                <div className="mini-spinner"></div>
                                Checking current vacancies...
                            </div>
                        )}

                        {action === 'apply' && jobDetails && !checkingVacancies && (
                            <div className={`vacancy-status-banner ${jobDetails.workersHired >= jobDetails.workersRequired ? 'full' : 'available'}`}>
                                <div className="vacancy-icon">
                                    {jobDetails.workersHired >= jobDetails.workersRequired ? '⚠️' : '✅'}
                                </div>
                                <div className="vacancy-text">
                                    {jobDetails.workersHired >= jobDetails.workersRequired ? (
                                        <>
                                            <strong>Positions Filled</strong>
                                            This job is no longer accepting applications.
                                        </>
                                    ) : (
                                        <>
                                            <strong>Vacancies Available</strong>
                                            {jobDetails.workersRequired - jobDetails.workersHired} positions left. Proceed to apply.
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`rzp-options-grid ${action === 'apply' && jobDetails?.workersHired >= jobDetails?.workersRequired ? 'disabled-payments' : ''}`}>
                        <div className="rzp-sidebar">
                            <button
                                className={`sidebar-item ${selectedTab === 'UPI' ? 'active' : ''}`}
                                onClick={() => setSelectedTab('UPI')}
                            >
                                <FaMobileAlt /> UPI
                            </button>
                            <button
                                className={`sidebar-item ${selectedTab === 'Card' ? 'active' : ''}`}
                                onClick={() => setSelectedTab('Card')}
                            >
                                <FaCreditCard /> Cards
                            </button>
                            <button
                                className={`sidebar-item ${selectedTab === 'Netbanking' ? 'active' : ''}`}
                                onClick={() => setSelectedTab('Netbanking')}
                            >
                                <FaUniversity /> Netbanking
                            </button>
                            <button
                                className={`sidebar-item ${selectedTab === 'Wallet' ? 'active' : ''}`}
                                onClick={() => setSelectedTab('Wallet')}
                            >
                                <FaWallet /> Wallet
                            </button>
                        </div>

                        <div className="rzp-options-content">
                            {selectedTab === 'UPI' && (
                                <div className="upi-section">
                                    <span className="section-title">Popular Apps</span>
                                    <div className="upi-apps-grid">
                                        {upiApps.map(app => (
                                            <div
                                                key={app.name}
                                                className="upi-app-card"
                                                onClick={() => handleRazorpayPayment('upi')}
                                            >
                                                <div className="app-icon-wrapper">
                                                    <img src={app.icon} alt={app.name} />
                                                    {app.recommended && <span className="recommended-tag">Recommended</span>}
                                                </div>
                                                <span className="app-name">{app.name}</span>
                                            </div>
                                        ))}
                                        <div className="upi-app-card" onClick={() => handleRazorpayPayment('upi')}>
                                            <div className="app-icon-wrapper other">
                                                <FaMobileAlt />
                                            </div>
                                            <span className="app-name">Other Apps</span>
                                        </div>
                                    </div>

                                    <div className="upi-manual-input">
                                        <span className="section-title">Or Enter UPI ID</span>
                                        <div className="input-with-button">
                                            <input
                                                type="text"
                                                placeholder="e.g. name@bank"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                            />
                                            <button
                                                className="pay-btn-manual"
                                                disabled={!upiId.includes('@') || loading}
                                                onClick={() => handleRazorpayPayment('upi', upiId)}
                                            >
                                                {loading ? '...' : 'Pay'}
                                            </button>
                                        </div>
                                        <p className="upi-hint">User for manual entry via any UPI app</p>
                                    </div>
                                </div>
                            )}

                            {selectedTab === 'Card' && (
                                <div className="other-methods-placeholder">
                                    <FaCreditCard className="placeholder-icon" />
                                    <h4>Credit or Debit Cards</h4>
                                    <p>Select this to enter your card details on the next step</p>
                                    <button className="proceed-btn" onClick={() => handleRazorpayPayment('card')}>
                                        Pay via Card <FaChevronRight />
                                    </button>
                                </div>
                            )}

                            {selectedTab === 'Netbanking' && (
                                <div className="other-methods-placeholder">
                                    <FaUniversity className="placeholder-icon" />
                                    <h4>Netbanking</h4>
                                    <p>Select from 50+ banks including HDFC, SBI, ICICI</p>
                                    <button className="proceed-btn" onClick={() => handleRazorpayPayment('netbanking')}>
                                        Pay via Netbanking <FaChevronRight />
                                    </button>
                                </div>
                            )}

                            {selectedTab === 'Wallet' && (
                                <div className="other-methods-placeholder">
                                    <FaWallet className="placeholder-icon" />
                                    <h4>Digital Wallets</h4>
                                    <p>Pay using PhonePe, Paytm, Mobikwik, and more</p>
                                    <button className="proceed-btn" onClick={() => handleRazorpayPayment('wallet')}>
                                        Pay via Wallet <FaChevronRight />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {loading && (
                <div className="rzp-loading-overlay">
                    <div className="rzp-spinner"></div>
                    <p>Processing Secure Payment...</p>
                </div>
            )}
        </div>
    );
};

export default PaymentModal;
