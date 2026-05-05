import { TagsSection } from "./TagsSection";

type CategoriesSectionProps = {
  selectedId: string;
  categories: string[];
};

export function CategoriesSection({
  selectedId,
  categories,
}: CategoriesSectionProps) {
  return (
    <TagsSection
      label="Categories"
      emptyMessage="No categories."
      hasItems={categories.length > 0}
    >
      <div className="flex flex-wrap gap-2">
        {categories.map((category, idx) => (
          <span
            key={`${selectedId}-cat-${idx}`}
            className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs text-zinc-200"
          >
            {category}
          </span>
        ))}
      </div>
    </TagsSection>
  );
}
