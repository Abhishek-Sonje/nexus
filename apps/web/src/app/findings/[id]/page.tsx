import { createDatabase, getFinding } from '@nexus/db';
import { notFound } from 'next/navigation';

import { WorkspaceHeader } from '../../workspace-header';
import { NarrativePanel } from './narrative-panel';

export const dynamic = 'force-dynamic';

async function loadFinding(id: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  const { db, pool } = createDatabase(databaseUrl);
  try {
    return await getFinding(db, id);
  } finally {
    await pool.end();
  }
}

export default async function FindingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const finding = await loadFinding(id);
  if (!finding) notFound();
  const structured = finding.narrative?.structuredResponse;
  const narrative =
    structured && typeof structured.summary === 'string'
      ? structured.summary
      : finding.narrative?.fallbackText;
  return (
    <main className="workspace-page">
      <WorkspaceHeader current="runs" />
      <section className="workspace-intro compact">
        <p className="eyebrow">
          Rank {finding.score.rank} · {finding.score.riskBand} band
        </p>
        <h1>
          Community C-{String(finding.community.ordinal).padStart(3, '0')}
        </h1>
        <p>{finding.score.explanation.join(' ')}</p>
      </section>
      <dl className="lineage-grid finding-lineage">
        <div>
          <dt>Score</dt>
          <dd>{Number(finding.score.score).toFixed(1)}</dd>
        </div>
        <div>
          <dt>Members</dt>
          <dd>{finding.members.length}</dd>
        </div>
        <div>
          <dt>Relationships</dt>
          <dd>{finding.evidence.length}</dd>
        </div>
        <div>
          <dt>Flag decision</dt>
          <dd>
            {finding.score.flagged
              ? 'Above policy threshold'
              : 'Below policy threshold'}
          </dd>
        </div>
      </dl>
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>Deterministic score decomposition</h2>
            <p>AI content has no scoring authority</p>
          </div>
        </div>
        <div className="metric-register">
          {Object.entries(finding.score.features).map(([name, value]) => (
            <div key={name}>
              <span>{name.replace(/([A-Z])/g, ' $1')}</span>
              <strong>{(value * 100).toFixed(1)}%</strong>
            </div>
          ))}
        </div>
      </section>
      <NarrativePanel
        findingId={finding.community.id}
        initialNarrative={narrative ?? null}
        initialStatus={finding.narrative?.status ?? null}
        canGenerate={finding.score.flagged}
      />
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>Members</h2>
            <p>Synthetic identities only</p>
          </div>
        </div>
        <div className="member-grid">
          {finding.members.map((member) => (
            <div key={member.id}>
              <strong>{member.displayName}</strong>
              <span>
                {member.category} · {member.kycTier} KYC
              </span>
              <code>{member.id}</code>
            </div>
          ))}
        </div>
      </section>
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>Relationship evidence</h2>
            <p>Tabular alternative to the bounded graph</p>
          </div>
        </div>
        <div className="relationship-list">
          {finding.evidence.map((edge) => (
            <div className="relationship-row" key={edge.id}>
              <code>{edge.sourceEntityId.slice(0, 8)}</code>
              <span>{edge.type.replaceAll('_', ' ')}</span>
              <code>{edge.targetEntityId.slice(0, 8)}</code>
              <strong>{edge.contribution.toFixed(2)}</strong>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
