import React, { useState } from 'react';
import StarRating from './StarRating';
import './RatingModal.css';
import { ratingAPI } from '../services/api';
import { toast } from 'react-toastify';

const RatingModal = ({ isOpen, onClose, jobId, toUserId, toUserName, onRatingSubmitted }) => {
    const [stars, setStars] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('📤 Submitting Rating Payload:', { jobId, toUserId, stars, feedback });
        if (stars === 0) {
            toast.error('Please select a star rating');
            return;
        }

        setLoading(true);
        try {
            const response = await ratingAPI.submitRating({ jobId, toUserId, stars, feedback });

            if (response.success) {
                toast.success(response.message);
                onRatingSubmitted();
                onClose();
            }
        } catch (error) {
            console.error('Rating Submit Error Details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Failed to submit rating';
            const errorCode = error.response?.data?.code || '';
            toast.error(`${errorMessage} ${errorCode ? `(${errorCode})` : ''}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="rating-modal-overlay">
            <div className="rating-modal-container glass">
                <div className="rating-modal-header">
                    <h2>Rate your experience</h2>
                    <p>How was your work with <strong>{toUserName}</strong>?</p>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="rating-modal-body">
                    <div className="star-selection">
                        <StarRating rating={stars} setRating={setStars} size="large" />
                        <span className="star-label">{stars > 0 ? `${stars} Stars` : 'Select Rating'}</span>
                    </div>

                    <div className="feedback-section">
                        <label htmlFor="feedback">Feedback (Optional)</label>
                        <textarea
                            id="feedback"
                            placeholder="Share your experience (max 300 characters)..."
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value.substring(0, 300))}
                            maxLength={300}
                        />
                        <div className="char-count">{feedback.length}/300</div>
                    </div>

                    <div className="rating-info-box">
                        <i className="info-icon">i</i>
                        <p>This is a double-blind rating. Your feedback will remain hidden until both parties have submitted their ratings or 48 hours have passed.</p>
                    </div>

                    <div className="rating-modal-footer">
                        <button type="button" className="cancel-pill" onClick={onClose}>Cancel</button>
                        <button type="submit" className="submit-pill" disabled={loading}>
                            {loading ? 'Submitting...' : 'Submit Rating'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RatingModal;
