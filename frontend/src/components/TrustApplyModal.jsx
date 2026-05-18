import React, { useState } from 'react';
import './TrustApplyModal.css';

const TrustApplyModal = ({ isOpen, onClose, onApply, isApplying }) => {
    const [contactMobile, setContactMobile] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Payment Mobile Number');
    const [paymentValue, setPaymentValue] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic validation for mobile number (assuming 10 digits as a minimum standard for our target region)
        const mobileRegex = /^[0-9]{10}$/;
        if (!mobileRegex.test(contactMobile)) {
            alert("Please enter a valid 10-digit contact mobile number.");
            return;
        }

        if (paymentMethod === 'Payment Mobile Number' && !mobileRegex.test(paymentValue)) {
            alert("Please enter a valid 10-digit payment mobile number.");
            return;
        }

        if (paymentMethod === 'UPI ID' && !paymentValue.includes('@')) {
            alert("Please enter a valid UPI ID (e.g., name@bank).");
            return;
        }

        onApply({
            contactMobile,
            paymentMethod,
            paymentValue
        });
    };

    return (
        <div className="trust-modal-overlay" onClick={onClose}>
            <div className="trust-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="trust-modal-header">
                    <h2>Trust & Verification</h2>
                    <p>Complete your application to increase transparency and trust with the employer.</p>
                </div>

                <form onSubmit={handleSubmit} className="trust-form">
                    <div className="form-group">
                        <label>Contact Mobile Number</label>
                        <p className="field-hint">Used by the employer to reach out to you for the job.</p>
                        <input
                            type="tel"
                            required
                            placeholder="e.g. 9876543210"
                            value={contactMobile}
                            onChange={(e) => setContactMobile(e.target.value)}
                        />
                    </div>

                    <div className="payment-info-section">
                        <h3>Payment Details</h3>
                        <p className="payment-hint">Select how you'd like to receive your payment after work completion.</p>

                        <div className="payment-options">
                            <label className={`payment-option ${paymentMethod === 'Payment Mobile Number' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="Payment Mobile Number"
                                    checked={paymentMethod === 'Payment Mobile Number'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                Mobile Number
                            </label>
                            <label className={`payment-option ${paymentMethod === 'UPI ID' ? 'selected' : ''}`}>
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    value="UPI ID"
                                    checked={paymentMethod === 'UPI ID'}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                />
                                UPI ID
                            </label>
                        </div>

                        <div className="form-group">
                            <label>{paymentMethod === 'UPI ID' ? 'UPI ID' : 'Payment Mobile Number'}</label>
                            <input
                                type="text"
                                required
                                placeholder={paymentMethod === 'UPI ID' ? 'e.g. name@bank' : 'e.g. 9876543210'}
                                value={paymentValue}
                                onChange={(e) => setPaymentValue(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="trust-modal-info">
                        <p>🛡️ Your payment details are only visible to the employer if they accept your application.</p>
                    </div>

                    <div className="trust-modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={isApplying}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-trust-apply" disabled={isApplying}>
                            {isApplying ? 'Submitting...' : 'Confirm & Apply'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TrustApplyModal;
