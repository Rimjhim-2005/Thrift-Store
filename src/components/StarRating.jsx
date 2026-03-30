import { useState } from "react";
import "./StarRating.css";

export default function StarRating({
  rating = 0,
  maxStars = 5,
  interactive = false,
  onRatingChange,
  size = "medium",
  showValue = false,
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleMouseEnter = (starIndex) => {
    if (interactive) {
      setHoverRating(starIndex);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const handleClick = (starIndex) => {
    if (interactive && onRatingChange) {
      setIsAnimating(true);
      onRatingChange(starIndex);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className={`star-rating ${size} ${isAnimating ? "animating" : ""}`}>
      <div className="stars-container">
        {Array.from({ length: maxStars }, (_, index) => {
          const starIndex = index + 1;
          const isFilled = starIndex <= displayRating;
          const isHalf = !isFilled && starIndex - 0.5 <= displayRating;

          return (
            <span
              key={index}
              className={`star ${isFilled ? "filled" : ""} ${isHalf ? "half" : ""} ${
                interactive ? "interactive" : ""
              }`}
              onMouseEnter={() => handleMouseEnter(starIndex)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(starIndex)}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {isHalf ? (
                <span className="half-star">
                  <span className="half-left">★</span>
                  <span className="half-right">☆</span>
                </span>
              ) : (
                "★"
              )}
            </span>
          );
        })}
      </div>
      {showValue && (
        <span className="rating-value">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
