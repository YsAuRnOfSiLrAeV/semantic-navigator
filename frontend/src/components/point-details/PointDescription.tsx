type PointDescriptionProps = {
  description: string;
};

export function PointDescription({ description }: PointDescriptionProps) {
  return (
    <div className="text-sm text-zinc-200/90 leading-relaxed">
      {description || <span className="text-zinc-400">No description.</span>}
    </div>
  );
}
