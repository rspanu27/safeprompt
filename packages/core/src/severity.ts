import type { Severity } from './types';

/** Comparable ordering for severities. */
export const SEVERITY_RANK: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};
