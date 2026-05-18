import React, { useState } from 'react';
import { FaExclamationCircle, FaTimes, FaCloudUploadAlt } from 'react-icons/fa';
import { disputeAPI } from '../services/api';
import { toast } from 'react-toastify';
import './ComplaintModal.css';

const ComplaintModal = ({ isOpen, onClose, applicationId, jobTitle, onComplaintSubmitted }) => {
    const [issueType, setIssueType] = useState('PAYMENT_DELAYED');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) {
            toast.error('Please provide a description');
            return;
        }

        setLoading(true);
        try {
            await disputeAPI.reportPaymentIssue({
                applicationId,
                issueType,
                description
            });
            toast.success('Complaint filed successfully');
            onComplaintSubmitted();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to file complaint');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="complaint-modal-overlay">
            <div className="complaint-modal">
                <div className="modal-header">
                    <div className="header-title">
                        <FaExclamationCircle className="warning-icon" />
                        <h2>Report Payment Issue</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}><FaTimes /></button>
                </div>

                <div className="modal-body">
                    <p className="job-title-hint">Job: <strong>{jobTitle}</strong></p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Issue Type</label>
                            <select
                                value={issueType}
                                onChange={(e) => setIssueType(e.target.value)}
                                className="styled-select"
                            >
                                <option value="PAYMENT_DELAYED">Payment Delayed</option>
                                <option value="PAYMENT_NOT_GIVEN">Payment Not Given</option>
                                <option value="PARTIAL_PAYMENT">Partial Payment</option>
                                <option value="EMPLOYER_MISCONDUCT">Employer Misconduct</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Explain the issue in detail..."
                                rows="5"
                                className="styled-textarea"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Optional Evidence (Screenshot/Doc)</label>
                            <div className="file-upload-placeholder">
                                <FaCloudUploadAlt />
                                <span>Click to upload proofs (Coming soon)</span>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Submitting...' : 'Submit Complaint'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ComplaintModal;
