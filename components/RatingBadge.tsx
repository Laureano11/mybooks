/** La nota como número: una escala de 1 a 10 no se lee bien en estrellas. */
export function RatingBadge({ rating }: { rating: number | null }) {
  if (rating === null) return null;

  return (
    <span className="inline-flex items-baseline gap-1 text-3xl font-semibold text-accent">
      {rating}
      <span className="text-base text-muted">/10</span>
    </span>
  );
}
