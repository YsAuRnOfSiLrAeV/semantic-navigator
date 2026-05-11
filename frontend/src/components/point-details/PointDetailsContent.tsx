import { memo } from "react";

import { useSelectedPoint } from "../../state/selectors/mapSelectors";
import { CategoriesSection } from "./CategoriesSection";
import { getOptimizedTripadvisorUrl } from "./imageUrl";
import { PointDescription } from "./PointDescription";
import { PointExternalLink } from "./PointExternalLink";
import { PointMeta } from "./PointMeta";
import { PointNavigation } from "./PointNavigation";
import { PointPhoto } from "./PointPhoto";
import { PointTitle } from "./PointTitle";
import { ReviewTagsSection } from "./ReviewTagsSection";

const MAX_REVIEW_TAGS = Number(import.meta.env.VITE_MAX_REVIEW_TAGS);

export const PointDetailsContent = memo(function PointDetailsContent() {
  const selected = useSelectedPoint();

  if (!selected) {
    return <div className="text-sm text-zinc-400">Click a point to see details.</div>;
  }

  const originalPictureUrl = selected.picture || "";
  const optimizedPictureUrl = getOptimizedTripadvisorUrl(originalPictureUrl);
  const externalLink = selected.tripadvisor_url || selected.source_url;

  return (
    <div className="space-y-5">
      <PointNavigation selectedId={selected.id} />

      {selected.picture ? (
        <PointPhoto
          name={selected.name}
          originalPictureUrl={originalPictureUrl}
          optimizedPictureUrl={optimizedPictureUrl}
        />
      ) : null}

      <PointExternalLink externalLink={externalLink} />
      <PointMeta destination={selected.destination} rating={selected.rating} />
      <PointTitle name={selected.name} />
      <PointDescription description={selected.description} />

      <CategoriesSection selectedId={selected.id} categories={selected.categories} />
      <ReviewTagsSection
        selectedId={selected.id}
        reviewTags={selected.review_tags}
        maxVisibleTags={MAX_REVIEW_TAGS}
      />
    </div>
  );
});
