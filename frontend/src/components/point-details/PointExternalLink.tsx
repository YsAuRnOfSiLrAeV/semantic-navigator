type PointExternalLinkProps = {
  externalLink: string;
};

export function PointExternalLink({ externalLink }: PointExternalLinkProps) {
  if (!externalLink) {
    return <div className="text-sm text-zinc-400">No external link.</div>;
  }

  return (
    <a
      className="inline-flex rounded border border-white/20 px-3 py-2 text-sm text-zinc-100 hover:border-white/35"
      href={externalLink}
      target="_blank"
      rel="noreferrer"
    >
      Open source
    </a>
  );
}
