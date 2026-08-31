import { WorkspaceHeader } from '../workspace-header';

export default function MethodologyPage() {
  return (
    <main className="workspace-page">
      <WorkspaceHeader current="method" />
      <section className="workspace-intro">
        <p className="eyebrow">Defense-oriented synthetic evaluation</p>
        <h1>How Nexus measures suspicious networks</h1>
        <p>
          Nexus is a reproducible investigation demonstration, not a live
          payment platform, compliance system, or guarantee of real-world fraud
          performance.
        </p>
      </section>
      <div className="method-grid">
        <section>
          <span>01</span>
          <h2>Isolated data splits</h2>
          <p>
            Policy is tuned on one seeded synthetic dataset. Final metrics come
            only from an independently seeded held-out dataset.
          </p>
        </section>
        <section>
          <span>02</span>
          <h2>Evidence projection</h2>
          <p>
            Shared devices, shared payout accounts, and FIFO rapid pass-through
            become normalized evidence. Direction is retained before an
            undirected weighted Louvain projection.
          </p>
        </section>
        <section>
          <span>03</span>
          <h2>Deterministic detection</h2>
          <p>
            Seeded Louvain, locked configuration, checksums, and immutable run
            lineage make identical inputs reproducible. A shared-device signal
            alone cannot trigger a flag.
          </p>
        </section>
        <section>
          <span>04</span>
          <h2>Economic selection</h2>
          <p>
            The tuning split selects the operating point using ₹250 per
            false-positive community plus missed synthetic ring exposure.
          </p>
        </section>
        <section>
          <span>05</span>
          <h2>Held-out reporting</h2>
          <p>
            One-to-one maximum-overlap matching reports entity precision and
            recall, community precision, ring recall, false positives, missed
            exposure, and review cost.
          </p>
        </section>
        <section>
          <span>06</span>
          <h2>AI boundary</h2>
          <p>
            Gemini may summarize pseudonymous aggregate evidence. Its output can
            never change a score, band, rank, flag, or metric, and deterministic
            fallback remains available.
          </p>
        </section>
      </div>
      <section className="limitations">
        <h2>Known limits</h2>
        <p>
          The benchmark targets roughly 2,000 synthetic entities and batch
          analysis. Small 2–3 member rings, streaming detection, real-world
          validation, provider integration, case management, and compliance
          certification are explicit non-goals.
        </p>
      </section>
    </main>
  );
}
