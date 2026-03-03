export default function AboutPage() {
  return (
    <main className="p-6 md:p-10 text-zinc-100 space-y-6">
      <h1 className="text-3xl md:text-4xl font-semibold">About</h1>

      <section className="space-y-2 text-zinc-300">
        <h2 className="text-xl text-zinc-100">Project Goal</h2>
        <p>
          Build a solid semester-long foundation for a semantic travel app with map-based discovery,
          typed contracts, and route-based UI structure.
        </p>
      </section>

      <section className="space-y-2 text-zinc-300">
        <h2 className="text-xl text-zinc-100">Current Stack</h2>
        <p>Frontend: React + TypeScript + React Router + Plotly.</p>
        <p>Backend: FastAPI + Sentence Transformers + UMAP + KMeans.</p>
      </section>

      <section className="space-y-2 text-zinc-300">
        <h2 className="text-xl text-zinc-100">Roadmap</h2>
        <p>1. Migrate from the temporary news dataset to a travel dataset.</p>
        <p>2. Add semantic search based on user trip intent.</p>
        <p>3. Add filtering, shortlist features, and richer map interactions.</p>
      </section>

      <section className="space-y-2 text-zinc-300">
        <h2 className="text-xl text-zinc-100">AI Usage</h2>
        <p>
          AI was used for task decomposition, architecture validation, and generating content on About and Home pages :).
          All code changes were reviewed and verified manually.
        </p>
      </section>
    </main>
  );
}
