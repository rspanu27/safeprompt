import { DETECTORS, SEVERITY_RANK as RANK, type Finding, type Severity } from '@safeprompt/core';

export interface FindingGroup {
  readonly detectorId: string;
  readonly name: string;
  readonly severity: Severity;
  readonly count: number;
  /** Distinct component labels, e.g. "Database password", "Database host". */
  readonly parts: readonly string[];
  readonly evidence: readonly string[];
}

const NAMES = new Map(DETECTORS.map((d) => [d.id, d.name]));

const unique = (values: readonly string[]): string[] => [...new Set(values)];

/**
 * One row per detector, most serious first.
 *
 * A single connection string produces four findings (user, password, host and
 * database), and listing them separately would make one leak look like four.
 */
export function groupFindings(findings: readonly Finding[]): FindingGroup[] {
  const byDetector = new Map<string, Finding[]>();

  for (const finding of findings) {
    const group = byDetector.get(finding.detectorId);
    if (group === undefined) byDetector.set(finding.detectorId, [finding]);
    else group.push(finding);
  }

  const groups: FindingGroup[] = [];

  for (const [detectorId, members] of byDetector) {
    const worst = members.reduce((a, b) => (RANK[b.severity] > RANK[a.severity] ? b : a));

    groups.push({
      detectorId,
      name: NAMES.get(detectorId) ?? worst.label,
      severity: worst.severity,
      count: members.length,
      parts: unique(members.map((m) => m.label)),
      evidence: unique(members.flatMap((m) => m.evidence)),
    });
  }

  return groups.sort((a, b) => RANK[b.severity] - RANK[a.severity]);
}
