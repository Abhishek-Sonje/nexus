import type { AnalysisJobPayload } from '@nexus/core';
import { and, eq } from 'drizzle-orm';

import type { NexusDatabase } from './client';
import { analysisRuns, datasets, detectorProfiles } from './schema';

export class AnalysisCompatibilityError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AnalysisCompatibilityError';
  }
}

export async function createQueuedAnalysisRun(
  db: NexusDatabase,
  input: Omit<AnalysisJobPayload, 'runId' | 'requestId'> & {
    randomSeed: string;
    codeVersion: string;
  },
): Promise<string> {
  return db.transaction(async (transaction) => {
    const [dataset] = await transaction
      .select()
      .from(datasets)
      .where(eq(datasets.id, input.datasetId))
      .limit(1);
    if (!dataset || !dataset.ready)
      throw new AnalysisCompatibilityError(
        'DATASET_NOT_READY',
        'The requested dataset does not exist or is not ready.',
      );
    const expectedKind =
      input.mode === 'tune'
        ? 'tuning'
        : input.mode === 'evaluate'
          ? 'held_out'
          : 'demo';
    if (dataset.kind !== expectedKind)
      throw new AnalysisCompatibilityError(
        'DATASET_MODE_MISMATCH',
        `${input.mode} analysis requires a ${expectedKind} dataset.`,
      );
    if (input.mode === 'tune' && input.detectorProfileId)
      throw new AnalysisCompatibilityError(
        'PROFILE_NOT_ALLOWED',
        'Tuning creates a new locked detector profile.',
      );
    if (input.mode !== 'tune' && !input.detectorProfileId)
      throw new AnalysisCompatibilityError(
        'PROFILE_REQUIRED',
        'Evaluation and demo scoring require a locked detector profile.',
      );
    if (input.detectorProfileId) {
      const [profile] = await transaction
        .select({ id: detectorProfiles.id })
        .from(detectorProfiles)
        .where(
          and(
            eq(detectorProfiles.id, input.detectorProfileId),
            eq(detectorProfiles.locked, true),
          ),
        )
        .limit(1);
      if (!profile)
        throw new AnalysisCompatibilityError(
          'PROFILE_NOT_LOCKED',
          'The requested detector profile does not exist or is not locked.',
        );
    }
    const [run] = await transaction
      .insert(analysisRuns)
      .values({
        datasetId: dataset.id,
        detectorProfileId: input.detectorProfileId,
        mode: input.mode,
        status: 'queued',
        randomSeed: input.randomSeed,
        codeVersion: input.codeVersion,
        inputChecksum: dataset.checksum,
      })
      .returning({ id: analysisRuns.id });
    if (!run) throw new Error('Queued analysis run did not return an id.');
    return run.id;
  });
}

export async function getLockedDetectorProfile(
  db: NexusDatabase,
  profileId: string,
) {
  const [profile] = await db
    .select()
    .from(detectorProfiles)
    .where(
      and(
        eq(detectorProfiles.id, profileId),
        eq(detectorProfiles.locked, true),
      ),
    )
    .limit(1);
  return profile ?? null;
}

export async function markAnalysisRunFailed(
  db: NexusDatabase,
  runId: string,
  failureCode: string,
  failureSummary: string,
): Promise<void> {
  await db
    .update(analysisRuns)
    .set({
      status: 'failed',
      failureCode,
      failureSummary,
      completedAt: new Date(),
    })
    .where(eq(analysisRuns.id, runId));
}
