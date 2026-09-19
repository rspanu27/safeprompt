import type { Category, ContentContext, Finding, Severity } from '../types';

const RAISED: Record<Severity, Severity> = {
  low: 'medium',
  medium: 'high',
  high: 'critical',
  critical: 'critical',
};

interface Rule {
  readonly context: ContentContext;
  readonly category: Category;
  readonly reason: string;
}

/**
 * How serious a value is depends on where it appears. An email address in
 * ordinary text is usually a contact address, but in a production log it is
 * probably a real customer, and hostnames in a log are real servers.
 *
 * These rules only raise severity. Lowering it based on a guess about the
 * surroundings could hide a real leak, which is worse than an extra warning.
 */
const RULES: readonly Rule[] = [
  {
    context: 'log',
    category: 'pii',
    reason: 'Appears in an application log, so likely to be real user data',
  },
  {
    context: 'log',
    category: 'infrastructure',
    reason: 'Names live infrastructure in a production log',
  },
  {
    context: 'stack-trace',
    category: 'infrastructure',
    reason: 'Names live infrastructure in a stack trace',
  },
  {
    context: 'stack-trace',
    category: 'pii',
    reason: 'Appears in a stack trace, so likely to be real user data',
  },
  {
    context: 'env-file',
    category: 'infrastructure',
    reason: 'Part of deployed configuration rather than an example',
  },
];

/** Re-rate findings for the content they were found in. */
export function applyContext(
  findings: readonly Finding[],
  context: ContentContext,
): readonly Finding[] {
  return findings.map((finding) => {
    const rule = RULES.find((r) => r.context === context && r.category === finding.category);
    if (rule === undefined) return finding;

    const severity = RAISED[finding.severity];
    if (severity === finding.severity) return finding;

    return {
      ...finding,
      severity,
      evidence: [...finding.evidence, `Raised to ${severity}: ${rule.reason.toLowerCase()}`],
    };
  });
}
