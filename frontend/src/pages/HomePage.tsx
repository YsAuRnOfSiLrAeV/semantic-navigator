import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main className="p-6 md:p-10 text-zinc-100 space-y-6">
      <h1 className="text-3xl md:text-4xl font-semibold">Travel Semantic Navigator</h1>
      <p className="text-zinc-300 max-w-3xl">
        An interactive app for semantic place discovery: similar locations are grouped on a 2D map
        so users can quickly explore meaningful travel options.
      </p>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
        Current status: the demo still uses a news dataset as a technical base.
      </div>

      <div className="space-y-2 text-zinc-300">
        <p>How to use:</p>
        <p>1. Open the map and choose the number of points.</p>
        <p>2. Click a point to view details.</p>
        <p>3. Open the source link for more context.</p>
      </div>

      <div className="flex gap-3">
        <Link to="/map" className="px-4 py-2 rounded border border-white/20 hover:border-white/40">Open Map</Link>
        <Link to="/about" className="px-4 py-2 rounded border border-white/20 hover:border-white/40">About Project</Link>
      </div>
    </main>
  );
}
