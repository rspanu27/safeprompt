import { describe, expect, it } from 'vitest';
import { resolveOverlaps } from './overlaps';
import type { Finding, Severity } from '../types';

function finding(
  detectorId: string,
  start: number,
  end: number,
  severity: Severity = 'low',
): Finding {
  return {
    detectorId,
    category: 'secret',
    severity,
    confidence: 1,
    span: { start, end },
    label: `${detectorId} finding`,
    evidence: ['base'],
    redaction: { placeholder: detectorId.toUpperCase() },
  };
}

const ids = (findings: readonly Finding[]): string[] => findings.map((f) => f.detectorId);

describe('resolveOverlaps', () => {
  it('returns nothing for no findings', () => {
    expect(resolveOverlaps([])).toHaveLength(0);
  });

  it('keeps findings that do not overlap', () => {
    const resolved = resolveOverlaps([finding('a', 0, 5), finding('b', 10, 15)]);
    expect(ids(resolved)).toEqual(['a', 'b']);
  });

  it('treats touching spans as non-overlapping', () => {
    const resolved = resolveOverlaps([finding('a', 0, 5), finding('b', 5, 10)]);
    expect(resolved).toHaveLength(2);
  });

  it('keeps the higher severity finding when spans overlap', () => {
    const resolved = resolveOverlaps([
      finding('password', 10, 20, 'high'),
      finding('database-url', 0, 40, 'critical'),
    ]);

    expect(ids(resolved)).toEqual(['database-url']);
  });

  it('keeps the longer span when severities are equal', () => {
    const resolved = resolveOverlaps([finding('short', 5, 10), finding('long', 0, 30)]);
    expect(ids(resolved)).toEqual(['long']);
  });

  it('records the detectors it absorbed', () => {
    const [survivor] = resolveOverlaps([
      finding('database-url', 0, 40, 'critical'),
      finding('password', 10, 20, 'high'),
      finding('internal-host', 25, 35, 'medium'),
    ]);

    expect(survivor?.evidence).toContain('Also matched by: internal-host, password');
  });

  it('leaves evidence alone when nothing was absorbed', () => {
    const [survivor] = resolveOverlaps([finding('a', 0, 5)]);
    expect(survivor?.evidence).toEqual(['base']);
  });

  it('returns survivors ordered by position', () => {
    const resolved = resolveOverlaps([
      finding('c', 20, 25),
      finding('a', 0, 5),
      finding('b', 10, 15),
    ]);

    expect(ids(resolved)).toEqual(['a', 'b', 'c']);
  });

  it('does not depend on the order findings arrive in', () => {
    const findings = [
      finding('a', 0, 10, 'medium'),
      finding('b', 5, 15, 'medium'),
      finding('c', 12, 30, 'high'),
    ];

    const forwards = resolveOverlaps(findings);
    const backwards = resolveOverlaps([...findings].reverse());

    expect(ids(backwards)).toEqual(ids(forwards));
  });

  it('resolves a chain of overlaps without leaving a clash behind', () => {
    const resolved = resolveOverlaps([
      finding('a', 0, 10),
      finding('b', 8, 18),
      finding('c', 16, 26),
    ]);

    for (let i = 1; i < resolved.length; i += 1) {
      expect(resolved[i]?.span.start).toBeGreaterThanOrEqual(resolved[i - 1]?.span.end ?? 0);
    }
  });
});
