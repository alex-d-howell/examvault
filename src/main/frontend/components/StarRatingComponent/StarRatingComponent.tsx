import React from 'react';
import { Icon } from '@vaadin/react-components';
import './StarRatingComponent.css';

interface StarRatingProps {
  rating: number | null;
  onRatingChange: (rating: number | null) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showClearButton?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  onRatingChange, 
  disabled = false, 
  size = 'medium',
  showClearButton = true 
}) => {
  const sizeClass = size === 'small' ? 'star-small' : size === 'large' ? 'star-large' : 'star-medium';
  
  // Don't render anything if rating is 0, null, or undefined and this is a disabled (display-only) component
  if (disabled && (!rating || rating <= 0)) {
    return null;
  }
  
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-button ${sizeClass} ${rating && rating >= star ? 'star-filled' : 'star-empty'}`}
          onClick={() => !disabled && onRatingChange(rating === star ? null : star)}
          disabled={Boolean(disabled)}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Icon icon={rating && rating >= star ? "vaadin:star" : "vaadin:star-o"} />
        </button>
      ))}
      {showClearButton && rating && rating > 0 && (
        <button
          type="button"
          className="clear-rating"
          onClick={() => !disabled && onRatingChange(null)}
          disabled={Boolean(disabled)}
          title="Clear rating"
          aria-label="Clear rating"
        >
          <Icon icon="vaadin:close-small" />
        </button>
      )}
    </div>
  );
};