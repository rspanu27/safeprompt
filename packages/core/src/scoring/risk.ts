import { SEVERITY_RANK } from '../severity';
import type { Finding, RiskAssessment, RiskContribution, Severity } from '../types';

/** Gaps are wide so one critical finding outranks any realistic pile of low ones. */
const POINTS: Record<Severity, number> = {
  low: 4,
  medium: 12,
  high: 30,
  critical: 60,
};

/** Twenty addresses is a mailing list, not twenty leaks. Without decay, repetition saturates the score. */
const REPEAT_DECAY = 0.6;

/** Lower bound of each band, highest first. */
const BANDS: readonly (readonly [number, Severity])[] = [
  [70, 'critical'],
  [35, 'high'],
  [15, 'medium'],
  [0, 'low'],
];

function pointsFor(severity: Severity, count: number): number {
  const unit = POINTS[severity];
  let total = 0;
  for (let i = 0; i < count; i += 1) {
    total += unit * REPEAT_DECAY ** i;
  }
  return total;
}

function bandFor(score: number): Severity {
  for (const [floor, level] of BANDS) {
    if (score >= floor) return level;
  }
  return 'low';
}

/**
 * Combine findings into a score with an explainable breakdown.
 *
 * The level is the higher of the score's band and the worst single finding.
 * Accumulation lets several mediums compound; the floor stops one critical
 * finding being reported as merely high just because 60 points sits below the
 * critical threshold.
 */
export function assessRisk(findings: readonly Finding[]): RiskAssessment {
  const grouped = new Map<string, Finding[]>();

  for (const finding of findings) {
    const existing = grouped.get(finding.detectorId);
    if (existing === undefined) {
      grouped.set(finding.detectorId, [finding]);
    } else {
      existing.push(finding);
    }
  }

  const breakdown: RiskContribution[] = [];

  for (const [detectorId, group] of grouped) {
    const first = group[0];
    if (first === undefined) continue;

    breakdown.push({
      detectorId,
      label: first.label,
      severity: first.severity,
      count: group.length,
      points: Math.round(pointsFor(first.severity, group.length) * 10) / 10,
    });
  }

  breakdown.sort((a, b) => b.points - a.points);

  const score = Math.min(100, Math.round(breakdown.reduce((sum, entry) => sum + entry.points, 0)));

  let level = bandFor(score);
  for (const entry of breakdown) {
    if (SEVERITY_RANK[entry.severity] > SEVERITY_RANK[level]) level = entry.severity;
  }

  return { score, level, breakdown };
}
