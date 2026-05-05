import { useEffect, useMemo, useState } from "react";
import { TagsSection } from "./TagsSection";

type ReviewTagsSectionProps = {
  selectedId: string;
  reviewTags: string[];
  maxVisibleTags: number;
};

export function ReviewTagsSection({
  selectedId,
  reviewTags,
  maxVisibleTags,
}: ReviewTagsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [selectedId]);

  const hasHiddenTags = reviewTags.length > maxVisibleTags;

  const visibleTags = useMemo(() => {
    return isExpanded ? reviewTags : reviewTags.slice(0, maxVisibleTags);
  }, [isExpanded, reviewTags, maxVisibleTags]);

  return (
    <TagsSection
      label="Review Tags"
      emptyMessage="No review tags."
      hasItems={reviewTags.length > 0}
    >
      <div className="flex flex-wrap gap-2">
        {visibleTags.map((tag, idx) => (
          <span
            key={`${selectedId}-tag-${idx}`}
            className="rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-300"
          >
            {tag}
          </span>
        ))}

        {hasHiddenTags ? (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={
              isExpanded
                ? "rounded-md border bg-[#c7d8e8] border-white/15 px-2 py-1 text-xs text-black hover:cursor-pointer"
                : "rounded-md border border-white/15 px-2 py-1 text-xs text-zinc-400 hover:cursor-pointer"
            }
          >
            {isExpanded ? "Show less" : `+${reviewTags.length - maxVisibleTags}`}
          </button>
        ) : null}
      </div>
    </TagsSection>
  );
}
