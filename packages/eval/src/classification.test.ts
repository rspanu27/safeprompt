import { describe, expect, it } from 'vitest';
import { classifyCorpus } from './classification';
import { CORPUS, EXPECTED_CONTEXTS } from './corpus';
import type { Sample } from './corpus';

const sample = (id: string, text: string): Sample => ({ id, text, expected: [] });

describe('classifyCorpus', () => {
  it('counts a correct classification', () => {
    const result = classifyCorpus([sample('s1', '{"a": 1}')], { s1: 'json' });

    expect(result.correct).toBe(1);
    expect(result.accuracy).toBe(1);
    expect(result.misclassified).toHaveLength(0);
  });

  it('reports what it expected and what it got', () => {
    const result = classifyCorpus([sample('s1', '{"a": 1}')], { s1: 'sql' });

    expect(result.misclassified[0]).toEqual({
      sampleId: 's1',
      expected: 'sql',
      actual: 'json',
    });
  });

  it('lists unlabelled samples instead of scoring them', () => {
    const result = classifyCorpus([sample('s1', 'hello')], {});

    expect(result.unlabelled).toEqual(['s1']);
    expect(result.total).toBe(0);
  });

  it('labels every sample in the shipped corpus', () => {
    // Guards the accuracy figure: an unlabelled sample is excluded silently,
    // so the number would drift upward as the corpus grows.
    expect(classifyCorpus(CORPUS, EXPECTED_CONTEXTS).unlabelled).toEqual([]);
  });

  it('has no expectation for a sample that is not in the corpus', () => {
    const ids = new Set(CORPUS.map((s) => s.id));
    const orphans = Object.keys(EXPECTED_CONTEXTS).filter((id) => !ids.has(id));

    expect(orphans).toEqual([]);
  });
});
