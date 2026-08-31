import { z } from 'zod';

export const ANALYSIS_QUEUE = 'nexus-analysis';

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    requestId: z.string().min(1),
  }),
});

export const createRunRequestSchema = z.object({
  datasetId: z.uuid(),
  detectorProfileId: z.uuid().optional(),
  mode: z.enum(['tune', 'evaluate', 'score']),
});

export const analysisJobPayloadSchema = createRunRequestSchema.extend({
  runId: z.uuid(),
  requestId: z.uuid(),
});

export type AnalysisJobPayload = z.infer<typeof analysisJobPayloadSchema>;

export const sessionRequestSchema = z.object({
  password: z.string().min(1).max(256),
});

export function success<T>(data: T, meta?: Record<string, unknown>) {
  return meta === undefined ? { data } : { data, meta };
}
