/** La nota como número: una escala de 1 a 10 no se lee bien en estrellas. */
export function RatingBadge({
  rating,
  large = false,
}: {
  rating: number | null;
  large?: boolean;
}) {
  if (rating === null) return null;

  return (
    <span
      className={
        large
          ? "inline-flex items-baseline gap-1 text-3xl font-semibold text-accent"
          : "inline-flex items-baseline gap-0.5 text-sm font-semibold text-accent"
      }
    >
      {rating}
      <span className={large ? "text-base text-muted" : "text-xs text-muted"}>
        /10
      </span>
    </span>
  );
}
