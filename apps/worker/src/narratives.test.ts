import { describe, expect, it, vi } from 'vitest';

vi.mock('pino', () => ({
  default: () => ({
    child: () => ({ error: vi.fn(), warn: vi.fn() }),
  }),
}));

import {
  deterministicNarrative,
  generateNarrative,
  providerErrorDetails,
} from './narratives';

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
              summary: 'The measured network warrants evidence review.',
              strongestEvidence: ['Rapid pass-through is the leading signal.'],
              counterEvidence: ['The dataset is synthetic.'],
              uncertainty: 'Synthetic evidence is not proof of fraud.',
              suggestedReviewFocus: ['Review the timestamped flow evidence.'],
            }),
          }),
      },
    });

    expect(result.status).toBe('generated');
    expect(result.structuredResponse?.strongestEvidence).toEqual([
      'Rapid pass-through is the leading signal.',
    ]);
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

  it('keeps provider diagnostics useful without exposing the API key', () => {
    const apiKey = 'AIza123456789012345678901234567890';
    const error = Object.assign(
      new Error(`Request key=${apiKey} cannot access the configured model.`),
      { status: 404, code: 'NOT_FOUND' },
    );

    expect(providerErrorDetails(error, apiKey)).toEqual({
      errorName: 'Error',
      errorMessage:
        'Request key=[REDACTED_API_KEY] cannot access the configured model.',
      providerStatus: 404,
      providerCode: 'NOT_FOUND',
    });
  });

  it('retries a transient provider failure before using fallback', async () => {
    let attempts = 0;
    const result = await generateNarrative(input, {
      modelCode: 'gemini-test',
      maxRetries: 1,
      generator: {
        generate: () => {
          attempts += 1;
          if (attempts === 1)
            return Promise.reject(new Error('temporarily unavailable'));
          return Promise.resolve({
            text: JSON.stringify({
              summary: 'The measured network warrants evidence review.',
              strongestEvidence: ['Rapid pass-through is the leading signal.'],
              counterEvidence: ['The dataset is synthetic.'],
              uncertainty: 'Synthetic evidence is not proof of fraud.',
              suggestedReviewFocus: ['Review the timestamped flow evidence.'],
            }),
          });
        },
      },
    });

    expect(attempts).toBe(2);
    expect(result.status).toBe('generated');
  });
});
