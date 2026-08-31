import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const PROMPT_VERSION = 'nexus-investigator-brief-1';

export interface NarrativeInput {
  communityOrdinal: number;
  memberIds: readonly string[];
  score: number;
  riskBand: 'monitor' | 'review' | 'elevated' | 'critical';
  features: Record<string, number>;
  evidenceCounts: Record<string, number>;
}

const narrativeResponseSchema = z.object({
  title: z.string().min(1).max(100),
  summary: z.string().min(1).max(600),
  signals: z.array(z.string().min(1).max(180)).min(1).max(4),
  caveat: z.string().min(1).max(240),
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
            required: ['title', 'summary', 'signals', 'caveat'],
            properties: {
              title: { type: 'string', maxLength: 100 },
              summary: { type: 'string', maxLength: 600 },
              signals: {
                type: 'array',
                minItems: 1,
                maxItems: 4,
                items: { type: 'string', maxLength: 180 },
              },
              caveat: { type: 'string', maxLength: 240 },
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
  if (error instanceof Error && error.message === 'narrative_timeout')
    return 'timeout';
  return 'provider_error';
}

export async function generateNarrative(
  input: NarrativeInput,
  options: {
    apiKey?: string;
    modelCode: string;
    timeoutMs?: number;
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

  try {
    const generator =
      options.generator ?? geminiGenerator(options.apiKey!, options.modelCode);
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
    return {
      status: 'fallback',
      modelCode: options.modelCode,
      promptVersion: PROMPT_VERSION,
      fallbackText,
      latencyMs: Math.round(performance.now() - startedAt),
      errorCategory: errorCategory(error),
    };
  }
}
