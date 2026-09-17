import type { Detector, Finding } from '../types';

/** Narrower than RFC 5322, which allows addresses nobody actually writes. */
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

export const emailDetector: Detector = {
  id: 'email',
  category: 'pii',
  severity: 'low',
  description: 'Email addresses.',

  detect({ text }) {
    const findings: Finding[] = [];

    for (const match of text.matchAll(EMAIL_PATTERN)) {
      // Both are always present on a global match; `noUncheckedIndexedAccess`
      // just can't prove it.
      const value = match[0];
      const start = match.index;
      if (value === undefined || start === undefined) continue;

      findings.push({
        detectorId: 'email',
        category: 'pii',
        severity: 'low',
        confidence: 0.9,
        span: { start, end: start + value.length },
        label: 'Email address',
        evidence: ['Matches the local@domain.tld shape'],
        redaction: { placeholder: 'EMAIL' },
      });
    }

    return findings;
  },
};
