import type { Detector, Finding, Severity } from '../types';
import { isPlaceholder } from './shared/placeholders';

interface Rule {
  readonly pattern: RegExp;
  readonly label: string;
  readonly placeholder: string;
  readonly severity: Severity;
  readonly evidence: string;
}

/**
 * Provider tokens carry a fixed prefix and length, which makes them far more
 * precise than a generic high-entropy guess — the prefix alone tells you who
 * issued it and what it opens.
 */
const RULES: readonly Rule[] = [
  {
    pattern: /\b(?:AKIA|ASIA|AIDA|AROA|AIPA|ANPA|ANVA|ABIA|ACCA)[A-Z0-9]{16}\b/g,
    label: 'AWS access key ID',
    placeholder: 'AWS_KEY',
    severity: 'high',
    evidence: 'AWS key prefix followed by 16 uppercase base36 characters',
  },
  {
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36}\b/g,
    label: 'GitHub token',
    placeholder: 'GITHUB_TOKEN',
    severity: 'high',
    evidence: 'GitHub token prefix followed by 36 base62 characters',
  },
  {
    pattern: /\bgithub_pat_[A-Za-z0-9_]{60,}\b/g,
    label: 'GitHub fine-grained token',
    placeholder: 'GITHUB_TOKEN',
    severity: 'high',
    evidence: 'GitHub fine-grained personal access token prefix',
  },
  {
    // Publishable pk_ keys are meant to be public, so they are not flagged.
    pattern: /\b[sr]k_live_[A-Za-z0-9]{16,}\b/g,
    label: 'Stripe live secret key',
    placeholder: 'STRIPE_KEY',
    severity: 'critical',
    evidence: 'Stripe live-mode secret key prefix',
  },
  {
    pattern: /\b[sr]k_test_[A-Za-z0-9]{16,}\b/g,
    label: 'Stripe test secret key',
    placeholder: 'STRIPE_KEY',
    severity: 'medium',
    evidence: 'Stripe test-mode secret key prefix',
  },
  {
    pattern: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
    label: 'Slack token',
    placeholder: 'SLACK_TOKEN',
    severity: 'high',
    evidence: 'Slack token prefix',
  },
  {
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
    label: 'OpenAI API key',
    placeholder: 'OPENAI_KEY',
    severity: 'high',
    evidence: 'OpenAI secret key prefix',
  },
];

export const cloudTokenDetector: Detector = {
  id: 'cloud-token',
  name: 'API key or token',
  category: 'secret',
  severity: 'high',
  description: 'Provider-issued API keys and tokens identified by their prefix.',

  detect({ text }) {
    const findings: Finding[] = [];

    for (const rule of RULES) {
      for (const match of text.matchAll(rule.pattern)) {
        const value = match[0];
        const start = match.index;
        if (value === undefined || start === undefined) continue;
        if (isPlaceholder(value)) continue;

        findings.push({
          detectorId: 'cloud-token',
          category: 'secret',
          severity: rule.severity,
          confidence: 0.97,
          span: { start, end: start + value.length },
          label: rule.label,
          evidence: [rule.evidence],
          redaction: { placeholder: rule.placeholder },
        });
      }
    }

    return findings;
  },
};
