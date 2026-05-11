type PointMetaProps = {
  destination: string;
  rating: number;
};

export function PointMeta({ destination, rating }: PointMetaProps) {
  const hasValidRating = typeof rating === "number" && Number.isFinite(rating);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-200">
      <span className="rounded-full border border-white/20 px-2.5 py-1">
        {destination || "Unknown destination"}
      </span>
      <span className="rounded-full border border-white/20 px-2.5 py-1">
        Rating: {hasValidRating ? rating.toFixed(1) : "n/a"}
      </span>
    </div>
  );
}
