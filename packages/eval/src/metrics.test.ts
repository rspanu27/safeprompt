import type { Detector } from '@safeprompt/core';
import { describe, expect, it } from 'vitest';
import type { Sample } from './corpus';
import { evaluate } from './metrics';

/** Reports every occurrence of `needle`, so expectations are easy to control. */
function detectorFor(id: string, needle: string): Detector {
  return {
    id,
    category: 'secret',
    severity: 'high',
    name: id,
    description: `finds ${needle}`,
    detect({ text }) {
      const findings = [];
      let from = 0;

      for (;;) {
        const start = text.indexOf(needle, from);
        if (start === -1) break;

        findings.push({
          detectorId: id,
          category: 'secret' as const,
          severity: 'high' as const,
          confidence: 1,
          span: { start, end: start + needle.length },
          label: id,
          evidence: ['test'],
          redaction: { placeholder: 'X' },
        });

        from = start + needle.length;
      }

      return findings;
    },
  };
}

const sample = (id: string, text: string, expected: Sample['expected'] = []): Sample => ({
  id,
  text,
  expected,
});

describe('evaluate', () => {
  it('scores a perfect detector', () => {
    const result = evaluate(
      [detectorFor('d', 'SECRET')],
      [sample('s1', 'a SECRET here', [{ detectorId: 'd', value: 'SECRET' }])],
    );

    expect(result.overall).toMatchObject({
      truePositives: 1,
      falsePositives: 0,
      falseNegatives: 0,
      precision: 1,
      recall: 1,
    });
  });

  it('counts an unexpected finding as a false positive', () => {
    const result = evaluate([detectorFor('d', 'SECRET')], [sample('s1', 'a SECRET here')]);

    expect(result.overall.falsePositives).toBe(1);
    expect(result.overall.precision).toBe(0);
    expect(result.falsePositives[0]).toMatchObject({ sampleId: 's1', matched: 'SECRET' });
  });

  it('counts an unfound expectation as a miss', () => {
    const result = evaluate(
      [detectorFor('d', 'SECRET')],
      [sample('s1', 'nothing here', [{ detectorId: 'd', value: 'MISSING' }])],
    );

    expect(result.overall.falseNegatives).toBe(1);
    expect(result.overall.recall).toBe(0);
    expect(result.misses[0]).toMatchObject({ sampleId: 's1', value: 'MISSING' });
  });

  it('accepts a finding that overlaps the expected span without matching it exactly', () => {
    const result = evaluate(
      [detectorFor('d', 'SECRET')],
      [sample('s1', 'xxSECRETxx', [{ detectorId: 'd', value: 'SECRETxx' }])],
    );

    expect(result.overall.truePositives).toBe(1);
    expect(result.overall.falsePositives).toBe(0);
  });

  it('does not credit one detector for another detector expectation', () => {
    const result = evaluate(
      [detectorFor('d', 'SECRET')],
      [sample('s1', 'a SECRET here', [{ detectorId: 'other', value: 'SECRET' }])],
    );

    const scored = result.detectors.find((d) => d.detectorId === 'd');
    expect(scored?.falsePositives).toBe(1);
    expect(scored?.truePositives).toBe(0);
  });

  it('treats one expectation matched twice as a single true positive', () => {
    const result = evaluate(
      [detectorFor('d', 'ab')],
      [sample('s1', 'abab', [{ detectorId: 'd', value: 'abab' }])],
    );

    expect(result.overall.truePositives).toBe(1);
    expect(result.overall.falsePositives).toBe(0);
  });

  it('scores a silent detector as perfect on a negative corpus', () => {
    const result = evaluate([detectorFor('d', 'SECRET')], [sample('s1', 'nothing to see')]);

    expect(result.overall).toMatchObject({ precision: 1, recall: 1 });
  });

  it('counts positive and negative samples separately', () => {
    const result = evaluate(
      [detectorFor('d', 'SECRET')],
      [sample('s1', 'SECRET', [{ detectorId: 'd', value: 'SECRET' }]), sample('s2', 'clean')],
    );

    expect(result.sampleCount).toBe(2);
    expect(result.positiveCount).toBe(1);
    expect(result.negativeCount).toBe(1);
  });

  it('computes F1 as the harmonic mean', () => {
    // One hit, one miss, one false alarm: precision 1/2, recall 1/2.
    const result = evaluate(
      [detectorFor('d', 'ab')],
      [
        sample('s1', 'ab', [{ detectorId: 'd', value: 'ab' }]),
        sample('s2', 'ab'),
        sample('s3', 'zz', [{ detectorId: 'd', value: 'zz' }]),
      ],
    );

    expect(result.overall.precision).toBeCloseTo(0.5);
    expect(result.overall.recall).toBeCloseTo(0.5);
    expect(result.overall.f1).toBeCloseTo(0.5);
  });
});
