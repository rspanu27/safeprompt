import { SEVERITY_RANK } from '../severity';
import type { Finding } from '../types';

function overlaps(a: Finding, b: Finding): boolean {
  return a.span.start < b.span.end && b.span.start < a.span.end;
}

/** Severity, then span length, then position. Detector id breaks the last tie. */
function byPriority(a: Finding, b: Finding): number {
  return (
    SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
    b.span.end - b.span.start - (a.span.end - a.span.start) ||
    a.span.start - b.span.start ||
    a.detectorId.localeCompare(b.detectorId)
  );
}

/**
 * Reduce findings to a non-overlapping set.
 *
 * One `postgres://user:pw@host/db` matches the database-URL, password and
 * hostname detectors at once. Redacting all three corrupts the output; showing
 * all three turns one leak into several. The winner keeps a note of what it
 * absorbed so the UI can still mention the password.
 */
export function resolveOverlaps(findings: readonly Finding[]): readonly Finding[] {
  const candidates = [...findings].sort(byPriority);

  const accepted: Finding[] = [];
  const absorbedBy = new Map<number, string[]>();

  for (const candidate of candidates) {
    const clashIndex = accepted.findIndex((winner) => overlaps(winner, candidate));

    if (clashIndex === -1) {
      accepted.push(candidate);
      continue;
    }

    const existing = absorbedBy.get(clashIndex);
    if (existing === undefined) {
      absorbedBy.set(clashIndex, [candidate.detectorId]);
    } else if (!existing.includes(candidate.detectorId)) {
      existing.push(candidate.detectorId);
    }
  }

  return accepted
    .map((finding, index) => {
      const absorbed = absorbedBy.get(index);
      if (absorbed === undefined) return finding;

      return {
        ...finding,
        evidence: [...finding.evidence, `Also matched by: ${absorbed.sort().join(', ')}`],
      };
    })
    .sort((a, b) => a.span.start - b.span.start);
}
