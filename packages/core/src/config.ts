import { z } from 'zod';

const weightSetSchema = z.object({
  fastFlowDensity: z.number().nonnegative(),
  payoutConcentration: z.number().nonnegative(),
  sharedDeviceDensity: z.number().nonnegative(),
  graphDensity: z.number().nonnegative(),
  categoryAnomaly: z.number().nonnegative(),
});

export const generatorProfileSchema = z.object({
  version: z.string().min(1),
  entityCount: z.number().int().min(100),
  transactionCount: z.number().int().min(1),
  ringCount: z.number().int().min(1),
  legitimateDenseCount: z.number().int().min(1),
  minRingSize: z.number().int().min(5),
  maxRingSize: z.number().int().min(5),
  seeds: z.object({
    tuning: z.string().min(8),
    heldOut: z.string().min(8),
    demo: z.string().min(8),
  }),
});

export const detectorProfileSchema = z.object({
  version: z.string().min(1),
  randomSeed: z.string().min(8),
  flowWindowHours: z.number().positive(),
  flowRatio: z.number().min(0).max(1),
  attributeDegreeCap: z.number().int().min(2),
  matchJaccard: z.number().min(0).max(1),
  resolutionCandidates: z.array(z.number().positive()).min(1),
  thresholdCandidates: z.array(z.number().min(0).max(100)).min(1),
  weightCandidates: z.array(weightSetSchema).min(1),
  economics: z.object({
    reviewMinutes: z.number().positive(),
    analystHourlyRatePaise: z.string().regex(/^\d+$/),
  }),
  bands: z.object({
    review: z.number().min(0).max(100),
    elevated: z.number().min(0).max(100),
    critical: z.number().min(0).max(100),
  }),
});

export const nexusPolicySchema = z.object({
  generator: generatorProfileSchema,
  detector: detectorProfileSchema,
});

export type NexusPolicy = z.infer<typeof nexusPolicySchema>;
export type DetectorProfile = z.infer<typeof detectorProfileSchema>;

export const serverEnvironmentSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.url(),
  NEXUS_ACCESS_PASSWORD_HASH: z.string().min(20),
  NEXUS_SESSION_SECRET: z.string().min(32),
  NEXUS_ATTRIBUTE_HASH_KEY: z.string().min(32),
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default('gemini-3.7-flash'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.url().optional(),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function parseServerEnvironment(
  source: NodeJS.ProcessEnv,
): ServerEnvironment {
  return serverEnvironmentSchema.parse(source);
}
