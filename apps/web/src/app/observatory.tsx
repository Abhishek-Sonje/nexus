import type { DashboardSnapshot } from '@nexus/db/dashboard';
import {
  Activity,
  CircleDot,
  Database,
  Fingerprint,
  Radar,
  Route,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';

import { LogoutButton } from './logout-button';

const paise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function money(value: string): string {
  return paise.format(Number(BigInt(value)) / 100);
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function CostCurve({
  points,
}: {
  points: DashboardSnapshot['evaluation']['points'];
}) {
  const values = points.map((point) => Number(BigInt(point.totalCostPaise)));
  const maximum = Math.max(...values, 1);
  const coordinates = values
    .map((value, index) => {
      const x = points.length === 1 ? 50 : (index / (points.length - 1)) * 100;
      const y = 92 - (value / maximum) * 76;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <div className="curve" aria-label="Economic cost by score threshold">
      <svg viewBox="0 0 100 100" role="img" aria-labelledby="curve-title">
        <title id="curve-title">
          Total review and missed-exposure cost curve
        </title>
        <path d="M0 92H100" className="curve-axis" />
        <path d="M0 54H100" className="curve-guide" />
        <polyline points={coordinates} className="curve-line" />
        {points.map((point, index) => {
          const [x = 0, y = 0] = (coordinates.split(' ')[index] ?? '0,0')
            .split(',')
            .map(Number);
          return <circle key={point.threshold} cx={x} cy={y} r="2.4" />;
        })}
      </svg>
      <div className="curve-labels">
        <span>lower threshold</span>
        <span>higher threshold</span>
      </div>
    </div>
  );
}

function RelationshipMap({
  focus,
}: {
  focus: NonNullable<DashboardSnapshot['focus']>;
}) {
  const members = focus.members.slice(0, 12);
  const positions = new Map(
    members.map((member, index) => {
      const angle =
        (index / Math.max(1, members.length)) * Math.PI * 2 - Math.PI / 2;
      return [
        member.id,
        { x: 50 + Math.cos(angle) * 36, y: 50 + Math.sin(angle) * 35 },
      ] as const;
    }),
  );
  return (
    <figure className="relationship-map">
      <figcaption>
        <span>Bounded relationship view</span>
        <small>Top finding · first 12 members</small>
      </figcaption>
      <svg viewBox="0 0 100 100" role="img" aria-labelledby="network-title">
        <title id="network-title">
          Network evidence for the highest-ranked community
        </title>
        {focus.evidence.slice(0, 30).map((edge) => {
          const source = positions.get(edge.sourceEntityId);
          const target = positions.get(edge.targetEntityId);
          if (!source || !target) return null;
          return (
            <line
              key={edge.id}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              className={`network-edge network-${edge.type}`}
            />
          );
        })}
        {members.map((member, index) => {
          const position = positions.get(member.id);
          if (!position) return null;
          return (
            <g key={member.id}>
              <circle
                cx={position.x}
                cy={position.y}
                r={index === 0 ? 4.3 : 3.2}
              />
              <text x={position.x} y={position.y + 7}>
                {member.displayName.slice(0, 10)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function EmptyObservatory() {
  return (
    <div className="empty-state">
      <Activity size={30} strokeWidth={1.5} aria-hidden="true" />
      <h1>No completed evaluation yet</h1>
      <p>
        Run the worker pipeline to generate tuning, held-out evaluation, and
        ranked network findings.
      </p>
      <code>bun run pipeline:run</code>
    </div>
  );
}

export function Observatory({
  snapshot,
}: {
  snapshot: DashboardSnapshot | null;
}) {
  if (!snapshot) return <EmptyObservatory />;
  const summary = snapshot.evaluation.summary;
  const top = snapshot.findings[0];
  return (
    <main className="observatory-shell">
      <aside className="rail" aria-label="Workspace navigation">
        <a className="brand" href="/" aria-label="Nexus home">
          <Radar size={24} strokeWidth={1.5} />
          <span>Nexus</span>
        </a>
        <nav>
          <a href="#verdict" aria-current="page">
            <Activity />
            <span>Verdict</span>
          </a>
          <a href="#findings">
            <CircleDot />
            <span>Findings</span>
          </a>
          <a href="#evidence">
            <Route />
            <span>Evidence</span>
          </a>
          <a href="#provenance">
            <Fingerprint />
            <span>Provenance</span>
          </a>
        </nav>
        <LogoutButton />
      </aside>

      <div className="instrument-field">
        <header className="topline">
          <div>
            <p>Signal Observatory</p>
            <span>Held-out synthetic evaluation</span>
          </div>
          <div className="run-state">
            <i /> Run complete
          </div>
        </header>

        <section id="verdict" className="verdict-grid">
          <div className="verdict-main">
            <div className="verdict-title">
              <ShieldCheck aria-hidden="true" />
              <div>
                <h1>Detection verdict</h1>
                <p>Measured against unseen synthetic patterns</p>
              </div>
            </div>
            <div className="verdict-measure">
              <strong>{percent(summary.ringRecall)}</strong>
              <span>injected rings recovered</span>
            </div>
            <dl className="measure-strip">
              <div>
                <dt>Community precision</dt>
                <dd>{percent(summary.communityPrecision)}</dd>
              </div>
              <div>
                <dt>Entity recall</dt>
                <dd>{percent(summary.entityRecall)}</dd>
              </div>
              <div>
                <dt>False positives</dt>
                <dd>{summary.falsePositiveCount}</dd>
              </div>
              <div>
                <dt>Operating point</dt>
                <dd>{summary.selectedThreshold}</dd>
              </div>
            </dl>
            <p className="disclosure">
              {snapshot.evaluation.syntheticDisclosure}
            </p>
          </div>

          <div className="economics-panel">
            <div className="panel-heading">
              <h2>Economic operating point</h2>
              <SlidersHorizontal />
            </div>
            <CostCurve points={snapshot.evaluation.points} />
            <dl className="cost-register">
              <div>
                <dt>Total modeled cost</dt>
                <dd>{money(summary.totalCostPaise)}</dd>
              </div>
              <div>
                <dt>Review cost</dt>
                <dd>{money(summary.reviewCostPaise)}</dd>
              </div>
              <div>
                <dt>Missed exposure</dt>
                <dd>{money(summary.missedExposurePaise)}</dd>
              </div>
            </dl>
          </div>

          <div id="provenance" className="provenance-panel">
            <div className="panel-heading">
              <h2>Immutable run</h2>
              <Database />
            </div>
            <dl>
              <div>
                <dt>Completed</dt>
                <dd>
                  {new Date(snapshot.run.completedAt).toLocaleString('en-IN')}
                </dd>
              </div>
              <div>
                <dt>Dataset</dt>
                <dd>{snapshot.dataset.kind.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt>Detector</dt>
                <dd>{snapshot.detector.version}</dd>
              </div>
              <div>
                <dt>Seed</dt>
                <dd title={snapshot.run.randomSeed}>
                  {snapshot.run.randomSeed}
                </dd>
              </div>
              <div>
                <dt>Input</dt>
                <dd title={snapshot.run.inputChecksum}>
                  {snapshot.run.inputChecksum.slice(0, 12)}
                </dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd title={snapshot.run.outputChecksum}>
                  {snapshot.run.outputChecksum.slice(0, 12)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section id="findings" className="findings-section">
          <div className="section-heading">
            <div>
              <h2>Ranked disturbances</h2>
              <p>Deterministic score, evidence first</p>
            </div>
            <span>
              {snapshot.findings.filter((finding) => finding.flagged).length}{' '}
              above threshold
            </span>
          </div>
          <div
            className="finding-register"
            role="table"
            aria-label="Ranked network findings"
          >
            <div className="finding-row finding-header" role="row">
              <span>Rank</span>
              <span>Community</span>
              <span>Members</span>
              <span>Leading evidence</span>
              <span>Band</span>
              <span>Score</span>
            </div>
            {snapshot.findings.slice(0, 8).map((finding) => (
              <a
                className="finding-row"
                role="row"
                href="#evidence"
                key={finding.id}
              >
                <span className="rank">
                  {String(finding.rank).padStart(2, '0')}
                </span>
                <span>C-{String(finding.ordinal).padStart(3, '0')}</span>
                <span>{finding.memberCount}</span>
                <span>{finding.explanation[0] ?? 'Network evidence'}</span>
                <span>
                  <i className={`band band-${finding.riskBand}`} />
                  {finding.riskBand}
                </span>
                <strong>{finding.score.toFixed(1)}</strong>
              </a>
            ))}
          </div>
        </section>

        {top && snapshot.focus ? (
          <section id="evidence" className="evidence-section">
            <div className="section-heading">
              <div>
                <h2>
                  Evidence register · C-{String(top.ordinal).padStart(3, '0')}
                </h2>
                <p>
                  {top.narrative ??
                    'Deterministic evidence summary available below.'}
                </p>
              </div>
              <span>{snapshot.focus.evidence.length} relationships</span>
            </div>
            <div className="evidence-layout">
              <div className="feature-register">
                {Object.entries(top.features).map(([name, value]) => (
                  <div key={name}>
                    <span>{name.replace(/([A-Z])/g, ' $1')}</span>
                    <div>
                      <i style={{ width: `${value * 100}%` }} />
                    </div>
                    <strong>{percent(value)}</strong>
                  </div>
                ))}
              </div>
              <div className="relationship-column">
                <RelationshipMap focus={snapshot.focus} />
                <div
                  className="relationship-list"
                  aria-label="Relationship evidence table"
                >
                  <div className="relationship-head">
                    <span>Source</span>
                    <span>Signal</span>
                    <span>Target</span>
                    <span>Weight</span>
                  </div>
                  {snapshot.focus.evidence.slice(0, 12).map((edge) => (
                    <div className="relationship-row" key={edge.id}>
                      <code>{edge.sourceEntityId.slice(0, 8)}</code>
                      <span>{edge.type.replaceAll('_', ' ')}</span>
                      <code>{edge.targetEntityId.slice(0, 8)}</code>
                      <strong>{edge.contribution.toFixed(2)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
