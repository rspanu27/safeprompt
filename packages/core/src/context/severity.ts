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
 * Severity is not a property of a value on its own.
 *
 * An address in prose is someone's contact detail. The same address in a
 * production log is a real customer, alongside evidence of what they did — and
 * the infrastructure it names is live rather than illustrative.
 *
 * Adjustments only ever raise. Lowering a finding because of a guess about its
 * surroundings trades a false positive for a missed leak, which is the wrong
 * way round for this tool.
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
