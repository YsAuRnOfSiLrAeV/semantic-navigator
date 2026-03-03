import { useState } from "react";
import type { TravelPoint } from "../types";
import PointDetailsPanelMobile from "./PointDetailsPanelMobile";

const MAX_REVIEW_TAGS = Number(import.meta.env.VITE_MAX_REVIEW_TAGS);

type Props = {
  selected: TravelPoint | null;
  open: boolean;
  onClose: () => void;
};

function PointDetailsContent({ selected }: { selected: TravelPoint | null }) {
  const [reviewTagsExtended, setReviewTagsExtended] = useState(false);

  function toggleReviewTags() {
    setReviewTagsExtended((prev) => !prev);
  }

  if (!selected) {
    return <div className="text-sm text-zinc-400">Click a point to see details.</div>;
  }

  const externalLink = selected.tripadvisor_url || selected.attraction_url;
  const hasHiddenReviewTags = selected.review_tags.length > MAX_REVIEW_TAGS;
  const visibleTags = reviewTagsExtended
    ? selected.review_tags
    : selected.review_tags.slice(0, MAX_REVIEW_TAGS);

  return (
    <div className="space-y-5">
      {selected.picture ? (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <img src={selected.picture} alt={selected.name} className="h-44 w-full object-cover" loading="lazy" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-200">
        <span className="rounded-full border border-white/20 px-2.5 py-1">{selected.destination || "Unknown destination"}</span>
        <span className="rounded-full border border-white/20 px-2.5 py-1">
          Rating: {Number.isFinite(selected.rating) ? selected.rating.toFixed(1) : "n/a"}
        </span>
      </div>

      <div className="text-base font-semibold leading-snug">{selected.name}</div>

      <div className="text-sm text-zinc-200/90 leading-relaxed">
        {selected.description || <span className="text-zinc-400">No description.</span>}
      </div>

      <section className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-zinc-400">Categories</div>
        {selected.categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selected.categories.map((category, idx) => (
              <span key={`${selected.id}-cat-${idx}`} className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-zinc-200">
                {category}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-sm text-zinc-400">No categories.</div>
        )}
      </section>

      <section className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-zinc-400">Review Tags</div>
        {selected.review_tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {visibleTags.map((tag, idx) => (
              <span key={`${selected.id}-tag-${idx}`} className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-300">
                {tag}
              </span>
            ))}
            {hasHiddenReviewTags ? (
              <button
                onClick={toggleReviewTags}
                className={reviewTagsExtended
                  ? "rounded-md border bg-[#c7d8e8] border-white/15 px-2 py-1 text-xs text-[#000000] hover:cursor-pointer"
                  : "rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-400 hover:cursor-pointer"}
              >
                {reviewTagsExtended ? "Show less" : `+${selected.review_tags.length - MAX_REVIEW_TAGS}`}
              </button>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-zinc-400">No review tags.</div>
        )}
      </section>

      {externalLink ? (
        <a
          className="inline-flex rounded border border-white/20 px-3 py-2 text-sm text-zinc-100 hover:border-white/35"
          href={externalLink}
          target="_blank"
          rel="noreferrer"
        >
          Open source
        </a>
      ) : (
        <div className="text-sm text-zinc-400">No external link.</div>
      )}
    </div>
  );
}

export default function PointDetailsPanel({ selected, open, onClose }: Props) {
  return (
    <>
      <aside className="hidden lg:block min-h-0">
        <div className="p-6 h-full overflow-auto">
          <PointDetailsContent selected={selected} />
        </div>
      </aside>

      <PointDetailsPanelMobile open={open} onClose={onClose}>
        <PointDetailsContent selected={selected} />
      </PointDetailsPanelMobile>
    </>
  );
}
