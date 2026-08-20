import React, { useState, useRef } from 'react';
import axios from 'axios';
import './TrustApplyModal.css';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

const TrustApplyModal = ({ isOpen, onClose, onApply, isApplying, jobType }) => {
    const [contactMobile, setContactMobile] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Payment Mobile Number');
    const [paymentValue, setPaymentValue] = useState('');
    const [resumeFile, setResumeFile] = useState(null);
    const [resumeError, setResumeError] = useState('');
    const [uploadingResume, setUploadingResume] = useState(false);
    const fileInputRef = useRef(null);

    // Resume is mandatory for Full-Time and Part-Time jobs
    const isResumeRequired = ['FULL_TIME', 'PART_TIME'].includes(jobType);

    if (!isOpen) return null;

    const handleResumeChange = (e) => {
        const file = e.target.files[0];
        setResumeError('');

        if (!file) {
            setResumeFile(null);
            return;
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            setResumeError('Only PDF, DOC, and DOCX files are allowed.');
            setResumeFile(null);
            e.target.value = '';
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setResumeError('Resume file must be under 5MB.');
            setResumeFile(null);
            e.target.value = '';
            return;
        }

        setResumeFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation for mobile number
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

        // Resume validation for required job types
        if (isResumeRequired && !resumeFile) {
            setResumeError('Resume is mandatory for Full-Time and Part-Time jobs.');
            return;
        }

        let resumeUrl = '';

        // Upload resume if selected
        if (resumeFile) {
            try {
                setUploadingResume(true);
                const formData = new FormData();
                formData.append('file', resumeFile);

                const token = localStorage.getItem('quickhire_token');
                const response = await axios.post(`${API_URL}/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.data.success) {
                    resumeUrl = response.data.filePath;
                } else {
                    setResumeError('Failed to upload resume. Please try again.');
                    setUploadingResume(false);
                    return;
                }
            } catch (error) {
                console.error('Resume upload error:', error);
                setResumeError('Failed to upload resume. Please try again.');
                setUploadingResume(false);
                return;
            } finally {
                setUploadingResume(false);
            }
        }

        onApply({
            contactMobile,
            paymentMethod,
            paymentValue
        }, resumeUrl);
    };

    return (
        <div className="trust-modal-overlay" onClick={onClose}>
            <div className="trust-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="trust-modal-header">
                    <h2>Trust & Verification</h2>
                    <p>Complete your application to increase transparency and trust with the employer.</p>
                </div>

                <form onSubmit={handleSubmit} className="trust-form">
                    {/* Resume Upload Section */}
                    <div className={`resume-upload-section ${isResumeRequired ? 'required' : ''}`}>
                        <div className="resume-header">
                            <h3>📄 Upload Resume {isResumeRequired && <span className="required-badge">Required</span>}</h3>
                            <p className="resume-hint">
                                {isResumeRequired
                                    ? 'Resume is mandatory for Full-Time and Part-Time job applications.'
                                    : 'Upload your resume to strengthen your application (optional).'}
                            </p>
                        </div>

                        <div
                            className={`resume-dropzone ${resumeFile ? 'has-file' : ''} ${resumeError ? 'has-error' : ''}`}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleResumeChange}
                                style={{ display: 'none' }}
                                id="resume-upload-input"
                            />
                            {resumeFile ? (
                                <div className="resume-file-info">
                                    <span className="resume-file-icon">✅</span>
                                    <div className="resume-file-details">
                                        <span className="resume-file-name">{resumeFile.name}</span>
                                        <span className="resume-file-size">
                                            {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="resume-remove-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setResumeFile(null);
                                            setResumeError('');
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div className="resume-placeholder">
                                    <span className="upload-icon">📎</span>
                                    <span className="upload-text">Click to upload resume</span>
                                    <span className="upload-formats">PDF, DOC, DOCX • Max 5MB</span>
                                </div>
                            )}
                        </div>
                        {resumeError && <p className="resume-error">{resumeError}</p>}
                    </div>

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
                        <button type="button" className="btn-cancel" onClick={onClose} disabled={isApplying || uploadingResume}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-trust-apply" disabled={isApplying || uploadingResume}>
                            {uploadingResume ? 'Uploading Resume...' : (isApplying ? 'Submitting...' : 'Confirm & Apply')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TrustApplyModal;
