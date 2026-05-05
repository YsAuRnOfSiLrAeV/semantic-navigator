import { useSelectedPoint } from "../../state/selectors/mapSelectors";
import { PointNavigation } from "./PointNavigation";
import { ReviewTagsSection } from "./ReviewTagsSection";
import { CategoriesSection } from "./CategoriesSection";
import { memo } from "react";

const MAX_REVIEW_TAGS = Number(import.meta.env.VITE_MAX_REVIEW_TAGS);

export const PointDetailsContent = memo(function PointDetailsContent() {
  const selected = useSelectedPoint();

  if (!selected) {
    return <div className="text-sm text-zinc-400">Click a point to see details.</div>;
  }

  const externalLink = selected.tripadvisor_url || selected.attraction_url;

  return (
    <div className="space-y-5">
      <PointNavigation
        selectedId={selected?.id ?? null}
      />

      {selected.picture ? (
        <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
          <img src={selected.picture} alt={selected.name} className="h-44 w-full object-cover" loading="lazy" />
        </div>
      ) : null}

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

      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-200">
        <span className="rounded-full border border-white/20 px-2.5 py-1">
          {selected.destination || "Unknown destination"}
        </span>
        <span className="rounded-full border border-white/20 px-2.5 py-1">
          Rating: {Number.isFinite(selected.rating) ? selected.rating.toFixed(1) : "n/a"}
        </span>
      </div>

      <div className="text-base font-semibold leading-snug">{selected.name}</div>

      <div className="text-sm text-zinc-200/90 leading-relaxed">
        {selected.description || <span className="text-zinc-400">No description.</span>}
      </div>

      <CategoriesSection
        selectedId={selected.id}
        categories={selected.categories}
      />

      <ReviewTagsSection
        selectedId={selected.id}
        reviewTags={selected.review_tags}
        maxVisibleTags={MAX_REVIEW_TAGS}
      />
    </div>
  );
})
