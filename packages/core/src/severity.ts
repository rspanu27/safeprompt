import type { Severity } from './types';

/** Comparable ordering for severities. */
export const SEVERITY_RANK: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function severityAtLeast(level: Severity, threshold: Severity): boolean {
  return SEVERITY_RANK[level] >= SEVERITY_RANK[threshold];
}
