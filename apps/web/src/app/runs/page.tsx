import { createDatabase, listAnalysisRuns } from '@nexus/db';

import { WorkspaceHeader } from '../workspace-header';

export const dynamic = 'force-dynamic';

async function loadRuns() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;
  const { db, pool } = createDatabase(databaseUrl);
  try {
    return await listAnalysisRuns(db);
  } finally {
    await pool.end();
  }
}

export default async function RunsPage() {
  const runs = await loadRuns().catch(() => null);
  return (
    <main className="workspace-page">
      <WorkspaceHeader current="runs" />
      <section className="workspace-intro">
        <p className="eyebrow">Immutable analysis lineage</p>
        <h1>Run history</h1>
        <p>
          Dataset provenance, stage state, and detector execution history for
          this private synthetic workspace.
        </p>
      </section>
      {!runs ? (
        <div className="notice notice-error">
          Run history is unavailable because PostgreSQL could not be reached.
        </div>
      ) : runs.length === 0 ? (
        <div className="notice">No analysis runs have been recorded.</div>
      ) : (
        <div className="data-table" role="table" aria-label="Analysis runs">
          <div className="data-row data-head" role="row">
            <span>Status</span>
            <span>Dataset</span>
            <span>Mode</span>
            <span>Code</span>
            <span>Created</span>
          </div>
          {runs.map((run) => (
            <a
              className="data-row"
              role="row"
              href={`/runs/${run.id}`}
              key={run.id}
            >
              <span className={`status status-${run.status}`}>
                {run.status}
              </span>
              <span>
                {run.datasetName}
                <small>{run.datasetKind.replace('_', ' ')}</small>
              </span>
              <span>{run.mode}</span>
              <code>{run.codeVersion}</code>
              <time dateTime={run.createdAt.toISOString()}>
                {run.createdAt.toLocaleString('en-IN')}
              </time>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
