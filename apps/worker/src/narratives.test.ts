import { describe, expect, it } from 'vitest';

import { deterministicNarrative, generateNarrative } from './narratives';

const input = {
  communityOrdinal: 7,
  memberIds: ['a', 'b', 'c'],
  score: 82.5,
  riskBand: 'critical' as const,
  features: { fastFlowDensity: 0.9, graphDensity: 0.6 },
  evidenceCounts: { fast_flow: 4 },
};

describe('investigator narratives', () => {
  it('always provides a deterministic fallback without an API key', async () => {
    const result = await generateNarrative(input, {
      modelCode: 'gemini-test',
    });

    expect(result.status).toBe('fallback');
    expect(result.errorCategory).toBe('not_configured');
    expect(result.fallbackText).toBe(deterministicNarrative(input));
    expect(result.fallbackText).toContain('risk score of 82.5');
  });

  it('accepts only a structured provider response', async () => {
    const result = await generateNarrative(input, {
      modelCode: 'gemini-test',
      generator: {
        generate: () =>
          Promise.resolve({
            text: JSON.stringify({
              title: 'Rapid pass-through cluster',
              summary: 'The measured network warrants evidence review.',
              signals: ['Rapid pass-through is the leading signal.'],
              caveat: 'Synthetic evidence is not proof of fraud.',
            }),
          }),
      },
    });

    expect(result.status).toBe('generated');
    expect(result.structuredResponse?.title).toBe('Rapid pass-through cluster');
  });

  it('falls back when provider structure is invalid', async () => {
    const result = await generateNarrative(input, {
      modelCode: 'gemini-test',
      generator: {
        generate: () => Promise.resolve({ text: '{"unsupported":true}' }),
      },
    });

    expect(result.status).toBe('fallback');
    expect(result.errorCategory).toBe('invalid_structure');
  });
});
