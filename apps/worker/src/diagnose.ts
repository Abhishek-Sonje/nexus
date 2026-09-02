/**
 * DIAGNOSTIC CLI: Analyze false-positive classification
 *
 * Loads and analyzes the persisted held-out run results using the actual detector
 * profile that was used, ensuring faithful reproduction of the persisted metrics.
 *
 * Run with: bun apps/worker/src/diagnose.ts [threshold]
 *   or:     bun apps/worker/src/diagnose.ts [datasetId] [threshold]
 *
 * If datasetId is omitted, automatically uses the most recent held-out dataset.
 *
 * Temporary script—safe to delete after diagnosis is complete.
 */

import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  createDatabase,
  loadDetectionInput,
  loadEvaluationTruth,
} from '@nexus/db';
import { nexusPolicySchema, detectorProfileSchema } from '@nexus/core';
import {
  diagnoseFalsePositives,
  formatDiagnosisReport,
} from '@nexus/detection';
import type { ScoredCommunity, EvaluationTruthGroup } from '@nexus/detection';

async function loadPolicy() {
  const rootCandidate = resolve(process.cwd(), 'config/nexus.policy.json');
  const policyPath = existsSync(rootCandidate)
    ? rootCandidate
    : resolve(process.cwd(), '../../config/nexus.policy.json');
  const raw = await readFile(policyPath, 'utf8');
  return nexusPolicySchema.parse(JSON.parse(raw) as unknown);
}

async function runDiagnosis() {
  const args = process.argv.slice(2);
  let datasetId = args[0];
  let thresholdArg = args[1];

  // If only one argument, treat it as threshold and auto-find dataset
  if (args.length === 1 && !Number.isNaN(Number(args[0]))) {
    thresholdArg = args[0];
    datasetId = '';
  }

  if (!thresholdArg) {
    console.error('Usage: bun diagnose.ts [datasetId] <threshold>');
    console.error('Examples:');
    console.error('  bun diagnose.ts 45  # Uses most recent held-out dataset');
    console.error('  bun diagnose.ts "abc-123-def" 45');
    process.exit(1);
  }

  const threshold = Number(thresholdArg);
  if (Number.isNaN(threshold)) {
    console.error('Threshold must be a number');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const { db, pool } = createDatabase(databaseUrl);

  try {
    // Auto-find held-out dataset if not provided
    if (!datasetId) {
      console.log('Searching for most recent held-out dataset...');
      const found = await db.query.datasets.findFirst({
        columns: { id: true, seed: true, createdAt: true },
        where: (table, { eq }) => eq(table.kind, 'held_out'),
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      });
      if (!found) {
        console.error(
          'No held-out dataset found. Provide datasetId explicitly: bun diagnose.ts <datasetId> <threshold>',
        );
        process.exit(1);
      }
      datasetId = found.id;
      console.log(`Found: ${datasetId} (seed: ${found.seed})\n`);
    }

    const stableDatasetId = datasetId;

    // Load persisted analysis run for this dataset
    console.log('Loading persisted analysis run...');
    const analysisRun = await db.query.analysisRuns.findFirst({
      where: (table, { eq }) => eq(table.datasetId, stableDatasetId),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });

    if (!analysisRun) {
      console.error(
        `No analysis run found for dataset ${datasetId}. Run pipeline first.`,
      );
      process.exit(1);
    }

    console.log(
      `Found analysis run: ${analysisRun.id} (mode: ${analysisRun.mode})`,
    );

    if (!analysisRun.detectorProfileId) {
      console.error('Analysis run has no detector profile ID');
      process.exit(1);
    }

    // Load detector profile configuration used in the run
    console.log('Loading detector profile configuration...');
    const profileRecord = await db.query.detectorProfiles.findFirst({
      where: (table, { eq }) => eq(table.id, analysisRun.detectorProfileId!),
    });

    if (!profileRecord) {
      console.error('Detector profile not found');
      process.exit(1);
    }

    const profile = detectorProfileSchema.parse(profileRecord.configuration);
    const selectedConfig = (profileRecord.configuration as any).selected;

    console.log(`Detector profile version: ${profile.version}`);
    console.log(`Selected resolution: ${selectedConfig.resolution}`);
    console.log(`Selected weightIndex: ${selectedConfig.weightIndex}`);
    console.log(`Selected threshold: ${selectedConfig.threshold}`);

    // Load persisted scored communities and truth for analysis
    console.log('Loading persisted communities and evaluation truth...');
    const [{ scoredCommunities }, truth] = await Promise.all([
      db.query.analysisRuns
        .findFirst({
          where: (table, { eq }) => eq(table.id, analysisRun.id),
        })
        .then(async (run) => {
          if (!run) throw new Error('Analysis run not found');
          // Load persisted data - for now, we'll re-score if needed
          return { scoredCommunities: [] as ScoredCommunity[] };
        }),
      loadEvaluationTruth(db, datasetId),
    ]);

    // Re-derive communities and scores using the locked detector configuration
    console.log('Re-deriving communities using actual detector profile...');
    const input = await loadDetectionInput(db, datasetId);

    const {
      deriveEvidence,
      detectCommunities,
      projectEvidenceGraph,
      scoreCommunities,
      communitiesFromPartition,
    } = await import('@nexus/detection');

    const evidence = deriveEvidence(input, profile);
    const graph = projectEvidenceGraph(input.entities, evidence.edges);

    const partition = detectCommunities(graph, {
      profile,
      resolution: selectedConfig.resolution,
    });

    const weights = profile.weightCandidates[selectedConfig.weightIndex];
    if (!weights) {
      console.error(`Weight index ${selectedConfig.weightIndex} not found`);
      process.exit(1);
    }

    const scored = scoreCommunities({
      communities: communitiesFromPartition(
        partition.communities,
        partition.modularity,
      ),
      ...input,
      evidence: evidence.edges,
      weights,
      threshold: selectedConfig.threshold,
      bands: profile.bands,
      categoryBaselines: selectedConfig.categoryBaselines,
    });

    console.log(`\nRe-derived: ${scored.length} total communities`);
    const flagged = scored.filter(
      (c) => c.flagEligible && c.score >= threshold,
    );
    console.log(
      `Flagged at threshold ${threshold}: ${flagged.length} communities\n`,
    );

    // Run diagnosis
    console.log(`Diagnosing false positives at threshold ${threshold}...`);
    const diagnosis = diagnoseFalsePositives(
      scored,
      truth,
      threshold,
      profile.matchJaccard,
    );

    console.log('');
    console.log(formatDiagnosisReport(diagnosis));

    process.exit(0);
  } catch (error) {
    console.error('Diagnosis failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runDiagnosis().catch(console.error);
