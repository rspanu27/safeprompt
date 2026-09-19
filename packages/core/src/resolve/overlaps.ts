import { SEVERITY_RANK } from '../severity';
import type { Finding } from '../types';

/** Severity, then span length, then position. Detector id breaks the last tie. */
function byPriority(a: Finding, b: Finding): number {
  return (
    SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
    b.span.end - b.span.start - (a.span.end - a.span.start) ||
    a.span.start - b.span.start ||
    a.detectorId.localeCompare(b.detectorId)
  );
}

interface Accepted {
  readonly finding: Finding;
  /** When it was accepted. The earliest-accepted winner absorbs a clash. */
  readonly order: number;
  readonly absorbed: string[];
}

/** Index of the first accepted span starting at or after `start`. */
function lowerBound(accepted: readonly Accepted[], start: number): number {
  let low = 0;
  let high = accepted.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if ((accepted[mid]?.finding.span.start ?? Infinity) < start) low = mid + 1;
    else high = mid;
  }
  return low;
}

/**
 * Reduce findings to a set that doesn't overlap.
 *
 * A single `postgres://user:pw@host/db` is matched by the database URL,
 * password and hostname detectors at the same time. Redacting all three would
 * mangle the output, and listing all three would make one leak look like
 * three. The finding that wins records which other detectors matched, so the
 * UI can still mention the password.
 *
 * Accepted spans are kept sorted and never overlap, so a candidate can only
 * clash with its neighbours, which are found with a binary search. The first
 * version compared each candidate with every accepted finding, which was
 * quadratic on large pastes.
 */
export function resolveOverlaps(findings: readonly Finding[]): readonly Finding[] {
  const candidates = [...findings].sort(byPriority);
  const accepted: Accepted[] = [];
  let accepts = 0;

  for (const candidate of candidates) {
    const { start, end } = candidate.span;
    const index = lowerBound(accepted, start);

    // The span before can reach into the candidate; any after it can start
    // inside the candidate. Nothing further away can touch it.
    let owner: Accepted | undefined;
    const before = accepted[index - 1];
    if (before !== undefined && before.finding.span.end > start) owner = before;

    for (let i = index; i < accepted.length; i += 1) {
      const after = accepted[i];
      if (after === undefined || after.finding.span.start >= end) break;
      if (owner === undefined || after.order < owner.order) owner = after;
    }

    if (owner === undefined) {
      accepted.splice(index, 0, { finding: candidate, order: accepts, absorbed: [] });
      accepts += 1;
    } else if (!owner.absorbed.includes(candidate.detectorId)) {
      owner.absorbed.push(candidate.detectorId);
    }
  }

  return accepted.map(({ finding, absorbed }) =>
    absorbed.length === 0
      ? finding
      : {
          ...finding,
          evidence: [...finding.evidence, `Also matched by: ${absorbed.sort().join(', ')}`],
        },
  );
}
