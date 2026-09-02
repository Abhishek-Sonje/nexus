/** Temporary, read-only held-out ring topology diagnostic. */
import {
  createDatabase,
  loadDetectionInput,
  loadEvaluationTruth,
} from '@nexus/db';
import { detectorProfileSchema } from '@nexus/core';
import {
  communitiesFromPartition,
  deriveEvidence,
  detectCommunities,
  projectEvidenceGraph,
  scoreCommunities,
} from '@nexus/detection';
import type { EvidenceEdge, ScoredCommunity } from '@nexus/detection';

type EvidenceType = EvidenceEdge['type'];
type TruthRing = Awaited<ReturnType<typeof loadEvaluationTruth>>[number];
type CategoryBaselines = Parameters<
  typeof scoreCommunities
>[0]['categoryBaselines'];
interface Selected {
  resolution: number;
  weightIndex: number;
  threshold: number;
  categoryBaselines?: CategoryBaselines;
}

function getSelected(value: unknown): Selected {
  const selected =
    value && typeof value === 'object' && 'selected' in value
      ? (value as { selected: unknown }).selected
      : undefined;
  if (!selected || typeof selected !== 'object')
    throw new Error('Locked profile has no selected configuration.');
  const item = selected as Record<string, unknown>;
  if (
    typeof item.resolution !== 'number' ||
    typeof item.weightIndex !== 'number' ||
    typeof item.threshold !== 'number'
  ) {
    throw new Error('Selected configuration is invalid.');
  }
  return item as unknown as Selected;
}

function jaccard(left: readonly string[], right: readonly string[]): number {
  const rightSet = new Set(right);
  return (
    left.filter((id) => rightSet.has(id)).length /
    Math.max(1, new Set([...left, ...right]).size)
  );
}

function components(
  members: readonly string[],
  edges: readonly EvidenceEdge[],
): string[][] {
  const memberSet = new Set(members);
  const neighbors = new Map(members.map((id) => [id, new Set<string>()]));
  for (const edge of edges) {
    if (
      !memberSet.has(edge.sourceEntityId) ||
      !memberSet.has(edge.targetEntityId)
    )
      continue;
    neighbors.get(edge.sourceEntityId)?.add(edge.targetEntityId);
    neighbors.get(edge.targetEntityId)?.add(edge.sourceEntityId);
  }
  const seen = new Set<string>();
  const result: string[][] = [];
  for (const member of [...members].sort()) {
    if (seen.has(member)) continue;
    const component: string[] = [];
    const queue = [member];
    while (queue.length) {
      const current = queue.shift();
      if (!current || seen.has(current)) continue;
      seen.add(current);
      component.push(current);
      queue.push(...(neighbors.get(current) ?? []));
    }
    result.push(component.sort());
  }
  return result.sort(
    (a, b) => b.length - a.length || a[0]!.localeCompare(b[0]!),
  );
}

function edgeSummary(
  edges: readonly EvidenceEdge[],
): Record<EvidenceType, { count: number; weight: number }> {
  const summary = {
    shared_payout_account: { count: 0, weight: 0 },
    shared_device: { count: 0, weight: 0 },
    fast_flow: { count: 0, weight: 0 },
  } satisfies Record<EvidenceType, { count: number; weight: number }>;
  for (const edge of edges) {
    summary[edge.type].count += 1;
    summary[edge.type].weight += edge.contribution;
  }
  for (const value of Object.values(summary))
    value.weight = Number(value.weight.toFixed(3));
  return summary;
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required.');
  const { db, pool } = createDatabase(databaseUrl);
  try {
    const compact = process.argv.includes('--compact');
    let datasetId = process.argv
      .slice(2)
      .find((argument) => !argument.startsWith('--'));
    if (!datasetId) {
      const dataset = await db.query.datasets.findFirst({
        columns: { id: true, seed: true },
        where: (table, { eq }) => eq(table.kind, 'held_out'),
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });
      if (!dataset) throw new Error('No held-out dataset found.');
      datasetId = dataset.id;
      console.log(`Dataset ${dataset.id} seed=${dataset.seed}`);
    }
    const stableDatasetId = datasetId;
    const run = await db.query.analysisRuns.findFirst({
      where: (table, { eq }) => eq(table.datasetId, stableDatasetId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });
    if (!run?.detectorProfileId)
      throw new Error('No locked analysis run found.');
    const profileRecord = await db.query.detectorProfiles.findFirst({
      where: (table, { eq }) => eq(table.id, run.detectorProfileId!),
    });
    if (!profileRecord) throw new Error('Locked detector profile not found.');
    const profile = detectorProfileSchema.parse(profileRecord.configuration);
    const selected = getSelected(profileRecord.configuration);
    const weights = profile.weightCandidates[selected.weightIndex];
    if (!weights)
      throw new Error(`Weight index ${selected.weightIndex} does not exist.`);
    const [input, truth] = await Promise.all([
      loadDetectionInput(db, stableDatasetId),
      loadEvaluationTruth(db, stableDatasetId),
    ]);
    const rings = truth.filter((group) => group.kind === 'ring');
    const evidence = deriveEvidence(input, profile).edges;
    const partition = detectCommunities(
      projectEvidenceGraph(input.entities, evidence),
      { profile, resolution: selected.resolution },
    );
    const scored = scoreCommunities({
      communities: communitiesFromPartition(
        partition.communities,
        partition.modularity,
      ),
      ...input,
      evidence,
      weights,
      threshold: selected.threshold,
      bands: profile.bands,
      ...(selected.categoryBaselines
        ? { categoryBaselines: selected.categoryBaselines }
        : {}),
    });
    const byOrdinal = new Map(
      scored.map((community) => [community.ordinal, community]),
    );
    const flagged = scored.filter(
      (community) =>
        community.flagEligible && community.score >= selected.threshold,
    );
    const candidates = flagged
      .flatMap((community, communityIndex) =>
        rings.map((ring, ringIndex) => ({
          communityIndex,
          ringIndex,
          overlap: jaccard(community.memberIds, ring.memberIds),
        })),
      )
      .filter((match) => match.overlap >= profile.matchJaccard)
      .sort(
        (a, b) =>
          b.overlap - a.overlap ||
          a.communityIndex - b.communityIndex ||
          a.ringIndex - b.ringIndex,
      );
    const matchedCommunities = new Set<number>();
    const matchedRings = new Set<number>();
    for (const match of candidates) {
      if (
        matchedCommunities.has(match.communityIndex) ||
        matchedRings.has(match.ringIndex)
      )
        continue;
      matchedCommunities.add(match.communityIndex);
      matchedRings.add(match.ringIndex);
    }

    const analyze = (ring: TruthRing) => {
      const memberSet = new Set(ring.memberIds);
      const internal = evidence.filter(
        (edge) =>
          memberSet.has(edge.sourceEntityId) &&
          memberSet.has(edge.targetEntityId),
      );
      const external = evidence.filter(
        (edge) =>
          memberSet.has(edge.sourceEntityId) !==
          memberSet.has(edge.targetEntityId),
      );
      const connected = components(ring.memberIds, internal);
      const ordinals = [
        ...new Set(
          ring.memberIds
            .map((id) => partition.communities[id])
            .filter((id): id is number => id !== undefined),
        ),
      ].sort((a, b) => a - b);
      const communities = ordinals
        .map((ordinal) => byOrdinal.get(ordinal))
        .filter((value): value is ScoredCommunity => Boolean(value));
      return { ring, memberSet, internal, external, connected, communities };
    };
    const missed = rings
      .filter((_, index) => !matchedRings.has(index))
      .map(analyze);
    const recovered = rings
      .filter((_, index) => matchedRings.has(index))
      .map(analyze);
    const comparisons = [...recovered]
      .sort(
        (a, b) =>
          Math.min(
            ...missed.map((m) =>
              Math.abs(m.ring.memberIds.length - a.ring.memberIds.length),
            ),
          ) -
          Math.min(
            ...missed.map((m) =>
              Math.abs(m.ring.memberIds.length - b.ring.memberIds.length),
            ),
          ),
      )
      .slice(0, 5);
    console.log(
      `Profile=${profile.version} resolution=${selected.resolution} weightIndex=${selected.weightIndex} threshold=${selected.threshold}`,
    );
    console.log(
      `Flagged=${flagged.length} matched=${matchedRings.size} unmatched=${flagged.length - matchedCommunities.size}`,
    );
    console.log(
      `Rings=${rings.length} recovered=${matchedRings.size} missed=${missed.length}`,
    );

    const print = (label: string, analyses: ReturnType<typeof analyze>[]) => {
      console.log(`\n=== ${label} ===`);
      for (const item of analyses) {
        const { ring, memberSet, internal, external, connected, communities } =
          item;
        console.log(`\nRING ${ring.id} size=${ring.memberIds.length}`);
        console.log(`members=${ring.memberIds.join(',')}`);
        console.log(`internal=${JSON.stringify(edgeSummary(internal))}`);
        for (const type of [
          'shared_payout_account',
          'shared_device',
          'fast_flow',
        ] as const) {
          const typed = internal.filter((edge) => edge.type === type);
          console.log(
            `${type}_edges=${typed.length ? typed.map((edge) => `${edge.sourceEntityId}->${edge.targetEntityId}@${edge.contribution.toFixed(3)}`).join(';') : 'none'}`,
          );
        }
        console.log(
          `pre_louvain_components=${connected.length} sizes=${connected.map((component) => component.length).join(',')} allConnected=${connected.length === 1}`,
        );
        console.log(
          `components=${connected.map((component) => `[${component.join(',')}]`).join(' ')}`,
        );
        console.log(
          `assignments=${ring.memberIds.map((id) => `${id}:${partition.communities[id] ?? 'missing'}`).join(',')}`,
        );
        for (const community of communities) {
          const ringMembers = community.memberIds.filter((id) =>
            memberSet.has(id),
          );
          console.log(
            `community=${community.ordinal} totalSize=${community.memberIds.length} ringMembers=${ringMembers.length} flagged=${community.flagEligible && community.score >= selected.threshold} score=${community.score} features=${JSON.stringify(community.features)} members=${community.memberIds.join(',')}`,
          );
        }
        console.log(`external=${JSON.stringify(edgeSummary(external))}`);
        for (const edge of external) {
          const detail =
            'value' in edge.detail
              ? ` value=${edge.detail.value} degree=${edge.detail.degree}`
              : '';
          console.log(
            `external_edge=${edge.type} ${edge.sourceEntityId}->${edge.targetEntityId} w=${edge.contribution.toFixed(3)}${detail}`,
          );
        }
      }
    };
    const compactPrint = (
      label: string,
      analyses: ReturnType<typeof analyze>[],
    ) => {
      console.log(`\n=== ${label} COMPACT ===`);
      for (const item of analyses) {
        const communitySummary = item.communities
          .map((community) => {
            const ringMembers = community.memberIds.filter((id) =>
              item.memberSet.has(id),
            ).length;
            return `${ringMembers}/${community.memberIds.length}@${community.score}:${community.flagEligible && community.score >= selected.threshold ? 'F' : 'U'}`;
          })
          .join('|');
        console.log(
          `${item.ring.id.slice(0, 8)} size=${item.ring.memberIds.length} components=${item.connected.map((part) => part.length).join('+')} internal=${JSON.stringify(edgeSummary(item.internal))} communities=${communitySummary} external=${JSON.stringify(edgeSummary(item.external))}`,
        );
      }
    };
    compactPrint('MISSED RINGS', missed);
    compactPrint('RECOVERED COMPARISONS', comparisons);
    if (!compact) {
      print('MISSED RINGS', missed);
      print('SIMILAR-SIZE RECOVERED COMPARISONS', comparisons);
    }
    const pre = missed.filter((item) => item.connected.length > 1).length;
    const during = missed.filter(
      (item) => item.connected.length === 1 && item.communities.length > 1,
    ).length;
    const single = missed.filter(
      (item) => item.communities.length === 1,
    ).length;
    console.log('\n=== SUMMARY ===');
    console.log(
      `missed_accounting total=${missed.length} preLouvainDisconnected=${pre} connectedButSplitByLouvain=${during} oneCommunityButUnmatched=${single}`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
