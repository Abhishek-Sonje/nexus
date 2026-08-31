'use client';

import type { DashboardSnapshot } from '@nexus/db/dashboard';
import dynamic from 'next/dynamic';

const RelationshipGraph = dynamic(() => import('./relationship-graph'), {
  ssr: false,
  loading: () => (
    <div className="graph-loading">Preparing bounded relationship view…</div>
  ),
});

export function BoundedGraph({
  focus,
}: {
  focus: NonNullable<DashboardSnapshot['focus']>;
}) {
  return <RelationshipGraph focus={focus} />;
}
