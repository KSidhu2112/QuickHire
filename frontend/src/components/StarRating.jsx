import React, { useState } from 'react';
import './StarRating.css';

const StarRating = ({ rating, setRating, interactive = true, size = 'medium' }) => {
    const [hover, setHover] = useState(0);

    return (
        <div className={`star-rating ${size}`}>
            {[...Array(5)].map((star, index) => {
                const ratingValue = index + 1;
                return (
                    <button
                        type="button"
                        key={index}
                        className={ratingValue <= (hover || rating) ? 'on' : 'off'}
                        onClick={() => interactive && setRating(ratingValue)}
                        onMouseEnter={() => interactive && setHover(ratingValue)}
                        onMouseLeave={() => interactive && setHover(0)}
                        disabled={!interactive}
                    >
                        <span className="star">&#9733;</span>
                    </button>
                );
            })}
        </div>
    );
};

export default StarRating;
