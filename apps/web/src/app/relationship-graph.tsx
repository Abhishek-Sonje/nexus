'use client';

import type { DashboardSnapshot } from '@nexus/db/dashboard';
import Graph from 'graphology';
import Sigma from 'sigma';
import { useEffect, useRef } from 'react';

const EDGE_COLORS: Record<string, string> = {
  fast_flow: '#e7b35f',
  shared_payout_account: '#a67f67',
  shared_device: '#59666e',
};

export default function RelationshipGraph({
  focus,
}: {
  focus: NonNullable<DashboardSnapshot['focus']>;
}) {
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!container.current) return;
    const graph = new Graph({ multi: true, type: 'mixed' });
    const members = focus.members.slice(0, 40);
    const memberIds = new Set(members.map((member) => member.id));
    members.forEach((member, index) => {
      const angle =
        (index / Math.max(members.length, 1)) * Math.PI * 2 - Math.PI / 2;
      graph.addNode(member.id, {
        x: Math.cos(angle),
        y: Math.sin(angle),
        size: index === 0 ? 8 : 6,
        label: member.displayName,
        color: index === 0 ? '#e7b35f' : '#93a09a',
      });
    });
    focus.evidence.slice(0, 120).forEach((edge) => {
      if (
        !memberIds.has(edge.sourceEntityId) ||
        !memberIds.has(edge.targetEntityId)
      )
        return;
      graph.addEdgeWithKey(edge.id, edge.sourceEntityId, edge.targetEntityId, {
        size: Math.max(0.5, edge.contribution * 2),
        color: EDGE_COLORS[edge.type] ?? '#59666e',
        type: edge.directed ? 'arrow' : 'line',
      });
    });
    const stage = container.current;
    let renderer: Sigma | undefined;
    const observer = new ResizeObserver(() => {
      if (renderer || stage.clientWidth === 0 || stage.clientHeight === 0)
        return;
      renderer = new Sigma(graph, stage, {
        allowInvalidContainer: false,
        renderEdgeLabels: false,
        labelColor: { color: '#93a09a' },
        labelFont: 'JetBrains Mono Variable',
        labelSize: 10,
        stagePadding: 28,
      });
    });
    observer.observe(stage);
    return () => {
      observer.disconnect();
      renderer?.kill();
    };
  }, [focus]);
  return (
    <figure className="relationship-map">
      <figcaption>
        <span>Bounded relationship view</span>
        <small>Selected finding · up to 40 members</small>
      </figcaption>
      <div ref={container} className="sigma-stage" aria-hidden="true" />
    </figure>
  );
}
