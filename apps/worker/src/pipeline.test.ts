import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

describe('analysis pipeline AI boundary', () => {
  it('does not import or invoke narrative generation', async () => {
    const source = await readFile(
      new URL('./pipeline.ts', import.meta.url),
      'utf8',
    );

    expect(source).not.toContain("from './narratives'");
    expect(source).not.toContain('generateNarrative(');
    expect(source).not.toContain('persistNarrative(');
    expect(source).toContain('persistAnalysisResult(');
  });
});
