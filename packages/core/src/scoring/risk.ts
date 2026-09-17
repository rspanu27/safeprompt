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

function summarise(detectorId: string, group: readonly Finding[]): RiskContribution | null {
  // A single detector can report components of differing severity — a
  // connection string yields a critical password beside a medium hostname — so
  // decay is applied per severity rather than across the whole group.
  const counts = new Map<Severity, number>();
  let worst: Finding | undefined;

  for (const finding of group) {
    counts.set(finding.severity, (counts.get(finding.severity) ?? 0) + 1);
    if (worst === undefined || SEVERITY_RANK[finding.severity] > SEVERITY_RANK[worst.severity]) {
      worst = finding;
    }
  }

  if (worst === undefined) return null;

  let points = 0;
  for (const [severity, count] of counts) {
    points += pointsFor(severity, count);
  }

  return {
    detectorId,
    label: worst.label,
    severity: worst.severity,
    count: group.length,
    points: Math.round(points * 10) / 10,
  };
}

/**
 * Combine findings into a score with an explainable breakdown.
 *
 * The level is the higher of the score's band and the worst single finding.
 * Accumulation lets several mediums compound; the floor stops one critical
 * finding being reported as merely high because 60 points sits below the
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
    const entry = summarise(detectorId, group);
    if (entry !== null) breakdown.push(entry);
  }

  breakdown.sort((a, b) => b.points - a.points);

  const score = Math.min(100, Math.round(breakdown.reduce((sum, entry) => sum + entry.points, 0)));

  let level = bandFor(score);
  for (const entry of breakdown) {
    if (SEVERITY_RANK[entry.severity] > SEVERITY_RANK[level]) level = entry.severity;
  }

  return { score, level, breakdown };
}
