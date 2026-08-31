import {
  createDatabase,
  getAnalysisRun,
  getEvaluationCurve,
  listRunFindings,
} from '@nexus/db';
import { notFound } from 'next/navigation';

import { WorkspaceHeader } from '../../workspace-header';

export const dynamic = 'force-dynamic';

async function loadRun(runId: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  const { db, pool } = createDatabase(databaseUrl);
  try {
    const run = await getAnalysisRun(db, runId);
    if (!run) return null;
    const [findings, curve] = await Promise.all([
      listRunFindings(db, { runId, limit: 25 }),
      getEvaluationCurve(db, runId),
    ]);
    return { ...run, findings, curve };
  } finally {
    await pool.end();
  }
}

export default async function RunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const result = await loadRun(runId);
  if (!result) notFound();
  return (
    <main className="workspace-page">
      <WorkspaceHeader current="runs" />
      <section className="workspace-intro compact">
        <p className="eyebrow">
          {result.dataset.kind.replace('_', ' ')} dataset
        </p>
        <h1>Analysis run</h1>
        <p className="mono-line">{result.run.id}</p>
      </section>
      <dl className="lineage-grid">
        <div>
          <dt>Status</dt>
          <dd className={`status status-${result.run.status}`}>
            {result.run.status}
          </dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>{result.run.mode}</dd>
        </div>
        <div>
          <dt>Dataset</dt>
          <dd>{result.dataset.name}</dd>
        </div>
        <div>
          <dt>Detector</dt>
          <dd>{result.detector?.version ?? 'Not locked'}</dd>
        </div>
        <div>
          <dt>Code version</dt>
          <dd>{result.run.codeVersion}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{result.run.createdAt.toLocaleString('en-IN')}</dd>
        </div>
      </dl>
      {result.run.failureSummary ? (
        <div className="notice notice-error">{result.run.failureSummary}</div>
      ) : null}
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>Stage timings</h2>
            <p>Recorded milliseconds by deterministic pipeline stage</p>
          </div>
        </div>
        <div className="metric-register">
          {Object.entries(result.run.stageTimings).map(([stage, duration]) => (
            <div key={stage}>
              <span>{stage.replace(/([A-Z])/g, ' $1')}</span>
              <strong>{duration.toFixed(2)} ms</strong>
            </div>
          ))}
        </div>
      </section>
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>Ranked communities</h2>
            <p>
              {result.findings.length} findings loaded by deterministic rank
            </p>
          </div>
        </div>
        {result.findings.map(({ community, score }) => (
          <a
            className="finding-card"
            href={`/findings/${community.id}`}
            key={community.id}
          >
            <span>#{score.rank}</span>
            <strong>C-{String(community.ordinal).padStart(3, '0')}</strong>
            <span>{community.memberCount} members</span>
            <span>{score.riskBand}</span>
            <b>{Number(score.score).toFixed(1)}</b>
          </a>
        ))}
      </section>
      {result.curve.length > 0 ? (
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <h2>Evaluation points</h2>
              <p>
                Synthetic held-out precision, recall, and modeled economic cost
              </p>
            </div>
          </div>
          <div className="metric-register">
            {result.curve.map((point) => (
              <div key={point.id}>
                <span>
                  Threshold {point.threshold} · P{' '}
                  {(point.precision * 100).toFixed(1)}% · R{' '}
                  {(point.recall * 100).toFixed(1)}%
                </span>
                <strong>
                  ₹
                  {(Number(point.totalCostPaise) / 100).toLocaleString('en-IN')}
                </strong>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
