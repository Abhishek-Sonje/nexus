import { GoogleGenAI } from '@google/genai';
import pino from 'pino';
import { z } from 'zod';

const PROMPT_VERSION = 'nexus-investigator-brief-1';
const logger = pino({ name: 'nexus-worker' }).child({
  component: 'gemini-narratives',
});

export interface NarrativeInput {
  communityOrdinal: number;
  memberIds: readonly string[];
  score: number;
  riskBand: 'monitor' | 'review' | 'elevated' | 'critical';
  features: Record<string, number>;
  evidenceCounts: Record<string, number>;
}

const narrativeResponseSchema = z.object({
  summary: z.string().min(1).max(600),
  strongestEvidence: z.array(z.string().min(1).max(180)).min(1).max(4),
  counterEvidence: z.array(z.string().min(1).max(180)).max(4),
  uncertainty: z.string().min(1).max(240),
  suggestedReviewFocus: z.array(z.string().min(1).max(180)).min(1).max(4),
});

export type StructuredNarrative = z.infer<typeof narrativeResponseSchema>;

export interface NarrativeResult {
  status: 'generated' | 'fallback';
  modelCode: string;
  promptVersion: string;
  structuredResponse?: StructuredNarrative;
  fallbackText: string;
  latencyMs: number;
  inputTokens?: number;
  outputTokens?: number;
  errorCategory?: string;
}

interface NarrativeGenerator {
  generate(input: NarrativeInput): Promise<{
    text: string;
    inputTokens?: number;
    outputTokens?: number;
  }>;
}

function topSignals(input: NarrativeInput): string[] {
  return Object.entries(input.features)
    .sort(([, left], [, right]) => right - left)
    .slice(0, 3)
    .map(([name, value]) => `${name} ${(value * 100).toFixed(1)}%`);
}

export function deterministicNarrative(input: NarrativeInput): string {
  return `Community ${input.communityOrdinal} contains ${input.memberIds.length} entities, has a deterministic risk score of ${input.score.toFixed(1)} (${input.riskBand}), and is led by ${topSignals(input).join(', ')}. Review the underlying evidence before drawing a conclusion.`;
}

function geminiGenerator(
  apiKey: string,
  modelCode: string,
): NarrativeGenerator {
  const ai = new GoogleGenAI({ apiKey });
  return {
    async generate(input) {
      const response = await ai.models.generateContent({
        model: modelCode,
        contents: [
          'Write a concise fraud-investigator brief from the structured synthetic network signals below.',
          'Do not claim fraud, invent facts, alter the score, or infer personal identity.',
          JSON.stringify(input),
        ].join('\n'),
        config: {
          temperature: 0.1,
          maxOutputTokens: 500,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            additionalProperties: false,
            required: [
              'summary',
              'strongestEvidence',
              'counterEvidence',
              'uncertainty',
              'suggestedReviewFocus',
            ],
            properties: {
              summary: { type: 'string', maxLength: 600 },
              strongestEvidence: {
                type: 'array',
                minItems: 1,
                maxItems: 4,
                items: { type: 'string', maxLength: 180 },
              },
              counterEvidence: {
                type: 'array',
                maxItems: 4,
                items: { type: 'string', maxLength: 180 },
              },
              uncertainty: { type: 'string', maxLength: 240 },
              suggestedReviewFocus: {
                type: 'array',
                minItems: 1,
                maxItems: 4,
                items: { type: 'string', maxLength: 180 },
              },
            },
          },
        },
      });
      if (!response.text) throw new Error('Gemini returned no text.');
      return {
        text: response.text,
        ...(response.usageMetadata?.promptTokenCount === undefined
          ? {}
          : { inputTokens: response.usageMetadata.promptTokenCount }),
        ...(response.usageMetadata?.candidatesTokenCount === undefined
          ? {}
          : { outputTokens: response.usageMetadata.candidatesTokenCount }),
      };
    },
  };
}

function errorCategory(error: unknown): string {
  if (error instanceof z.ZodError) return 'invalid_structure';
  if (error instanceof SyntaxError) return 'invalid_json';
  if (error instanceof Error && error.message === 'narrative_timeout')
    return 'timeout';
  return 'provider_error';
}

function readableProperty(
  error: unknown,
  property: 'status' | 'code',
): string | number | undefined {
  if (typeof error !== 'object' || error === null || !(property in error))
    return undefined;
  const record = error as Record<string, unknown>;
  const value = record[property];
  return typeof value === 'string' || typeof value === 'number'
    ? value
    : undefined;
}

export function providerErrorDetails(error: unknown, apiKey?: string) {
  const rawMessage =
    error instanceof Error ? error.message : 'Unknown Gemini provider error.';
  let message = rawMessage
    .replace(/AIza[\w-]{20,}/g, '[REDACTED_API_KEY]')
    .replace(/([?&]key=)[^&\s]+/gi, '$1[REDACTED_API_KEY]');
  if (apiKey) message = message.replaceAll(apiKey, '[REDACTED_API_KEY]');

  return {
    errorName: error instanceof Error ? error.name : 'UnknownError',
    errorMessage: message.slice(0, 500),
    providerStatus: readableProperty(error, 'status'),
    providerCode: readableProperty(error, 'code'),
  };
}

export async function generateNarrative(
  input: NarrativeInput,
  options: {
    apiKey?: string;
    modelCode: string;
    timeoutMs?: number;
    maxRetries?: number;
    generator?: NarrativeGenerator;
  },
): Promise<NarrativeResult> {
  const startedAt = performance.now();
  const fallbackText = deterministicNarrative(input);
  if (!options.apiKey && !options.generator) {
    return {
      status: 'fallback',
      modelCode: options.modelCode,
      promptVersion: PROMPT_VERSION,
      fallbackText,
      latencyMs: 0,
      errorCategory: 'not_configured',
    };
  }

  const maxAttempts = (options.maxRetries ?? 1) + 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const generator =
        options.generator ??
        geminiGenerator(options.apiKey!, options.modelCode);
      const timeoutMs = options.timeoutMs ?? 8_000;
      const generated = await Promise.race([
        generator.generate(input),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('narrative_timeout')), timeoutMs),
        ),
      ]);
      const structuredResponse = narrativeResponseSchema.parse(
        JSON.parse(generated.text) as unknown,
      );
      return {
        status: 'generated',
        modelCode: options.modelCode,
        promptVersion: PROMPT_VERSION,
        structuredResponse,
        fallbackText,
        latencyMs: Math.round(performance.now() - startedAt),
        ...(generated.inputTokens === undefined
          ? {}
          : { inputTokens: generated.inputTokens }),
        ...(generated.outputTokens === undefined
          ? {}
          : { outputTokens: generated.outputTokens }),
      };
    } catch (error) {
      const category = errorCategory(error);
      const latencyMs = Math.round(performance.now() - startedAt);
      const retrying =
        attempt < maxAttempts &&
        (category === 'timeout' || category === 'provider_error');
      const details = {
        event: retrying
          ? 'gemini_narrative_retrying'
          : 'gemini_narrative_failed',
        model: options.modelCode,
        promptVersion: PROMPT_VERSION,
        errorCategory: category,
        attempt,
        maxAttempts,
        latencyMs,
        ...providerErrorDetails(error, options.apiKey),
      };

      if (retrying) {
        logger.warn(details, 'Gemini narrative attempt failed; retrying');
        continue;
      }

      logger.error(
        details,
        'Gemini narrative generation failed; using deterministic fallback',
      );
      return {
        status: 'fallback',
        modelCode: options.modelCode,
        promptVersion: PROMPT_VERSION,
        fallbackText,
        latencyMs,
        errorCategory: category,
      };
    }
  }

  throw new Error('Gemini narrative attempt loop ended unexpectedly.');
}
