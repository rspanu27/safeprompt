import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { resolveOverlaps } from './overlaps';
import { SEVERITY_RANK } from '../severity';
import { textWithFindingsArb } from '../testing/arbitraries';
import type { Finding } from '../types';

const key = (f: Finding): string => `${f.detectorId}:${f.span.start}-${f.span.end}`;

/**
 * The original quadratic implementation, kept as an oracle. Short enough to be
 * obviously correct, which the optimised version is not.
 */
function referenceResolve(findings: readonly Finding[]): Finding[] {
  const byPriority = (a: Finding, b: Finding): number =>
    SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
    b.span.end - b.span.start - (a.span.end - a.span.start) ||
    a.span.start - b.span.start ||
    a.detectorId.localeCompare(b.detectorId);

  const accepted: Finding[] = [];
  const absorbed = new Map<number, string[]>();

  for (const c of [...findings].sort(byPriority)) {
    const clash = accepted.findIndex((w) => w.span.start < c.span.end && c.span.start < w.span.end);
    if (clash === -1) {
      accepted.push(c);
      continue;
    }
    const list = absorbed.get(clash) ?? [];
    if (!list.includes(c.detectorId)) list.push(c.detectorId);
    absorbed.set(clash, list);
  }

  return accepted
    .map((f, i) => {
      const list = absorbed.get(i);
      return list === undefined
        ? f
        : { ...f, evidence: [...f.evidence, `Also matched by: ${list.sort().join(', ')}`] };
    })
    .sort((a, b) => a.span.start - b.span.start);
}

describe('resolveOverlaps (properties)', () => {
  it('gives exactly the answer the simple quadratic version gives', () => {
    fc.assert(
      fc.property(textWithFindingsArb, ([, raw]) => {
        expect(resolveOverlaps(raw)).toEqual(referenceResolve(raw));
      }),
      { numRuns: 1000 },
    );
  });

  it('never returns two spans that overlap', () => {
    fc.assert(
      fc.property(textWithFindingsArb, ([, raw]) => {
        const resolved = resolveOverlaps(raw);
        for (let i = 1; i < resolved.length; i += 1) {
          expect(resolved[i]?.span.start).toBeGreaterThanOrEqual(resolved[i - 1]?.span.end ?? 0);
        }
      }),
    );
  });

  it('returns survivors ordered by position', () => {
    fc.assert(
      fc.property(textWithFindingsArb, ([, raw]) => {
        const starts = resolveOverlaps(raw).map((f) => f.span.start);
        expect(starts).toEqual([...starts].sort((a, b) => a - b));
      }),
    );
  });

  it('invents nothing that was not in the input', () => {
    fc.assert(
      fc.property(textWithFindingsArb, ([, raw]) => {
        const inputs = new Set(raw.map(key));
        for (const survivor of resolveOverlaps(raw)) {
          expect(inputs.has(key(survivor))).toBe(true);
        }
      }),
    );
  });

  it('drops a finding only when something it overlaps survived', () => {
    fc.assert(
      fc.property(textWithFindingsArb, ([, raw]) => {
        const resolved = resolveOverlaps(raw);
        const survivors = new Set(resolved.map(key));

        for (const candidate of raw) {
          if (survivors.has(key(candidate))) continue;

          const covered = resolved.some(
            (s) => s.span.start < candidate.span.end && candidate.span.start < s.span.end,
          );
          expect(covered).toBe(true);
        }
      }),
    );
  });

  it('always keeps a finding of the highest severity present', () => {
    fc.assert(
      fc.property(textWithFindingsArb, ([, raw]) => {
        if (raw.length === 0) return;

        const worst = Math.max(...raw.map((f) => SEVERITY_RANK[f.severity]));
        const kept = resolveOverlaps(raw).some((f) => SEVERITY_RANK[f.severity] === worst);

        expect(kept).toBe(true);
      }),
    );
  });

  it('does not depend on input order', () => {
    fc.assert(
      fc.property(textWithFindingsArb, ([, raw]) => {
        const forwards = resolveOverlaps(raw).map(key);
        const backwards = resolveOverlaps([...raw].reverse()).map(key);
        expect(backwards).toEqual(forwards);
      }),
    );
  });
});
