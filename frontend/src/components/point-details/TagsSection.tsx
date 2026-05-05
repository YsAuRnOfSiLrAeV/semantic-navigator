import { ReactNode } from "react";

type TagsSectionProps = {
  label: string;
  emptyMessage: string;
  hasItems: boolean;
  children: ReactNode;
};

export function TagsSection({ label, emptyMessage, hasItems, children }: TagsSectionProps) {
  return (
    <section className="space-y-2">
      <div className="text-xs uppercase tracking-wide text-zinc-400">{label}</div>
      {hasItems ? children : <div className="text-sm text-zinc-400">{emptyMessage}</div>}
    </section>
  );
}