const RatingStars = ({ rating = 0, ratingsCount = 0, size = 'sm', showCount = true }) => {
  const normalizedRating = Math.max(0, Math.min(5, Number(rating || 0)));
  const fullStars = Math.floor(normalizedRating);
  const hasHalfStar = normalizedRating - fullStars >= 0.5;

  const starClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-amber-400">
        {[0, 1, 2, 3, 4].map((index) => {
          const isFull = index < fullStars;
          const isHalf = index === fullStars && hasHalfStar;

          return (
            <span key={index} className={`${starClass} inline-flex items-center justify-center`}>
              {isFull ? '★' : isHalf ? '⯪' : '☆'}
            </span>
          );
        })}
      </div>
      <span className="text-sm font-medium text-slate-700">{normalizedRating.toFixed(1)}</span>
      {showCount ? (
        <span className="text-xs text-slate-500">({ratingsCount || 0} reviews)</span>
      ) : null}
    </div>
  );
};

export default RatingStars;
