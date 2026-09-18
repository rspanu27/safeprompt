import type { Detector, Finding } from '../types';

/** Narrower than RFC 5322, which allows addresses nobody actually writes. */
const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;

/** Reserved for documentation by RFC 2606, so never a real mailbox. */
const RESERVED_DOMAINS =
  /@(?:[A-Za-z0-9-]+\.)*(?:example\.(?:com|org|net)|example|invalid|test|localhost)$/i;

/**
 * `user:pass@host` inside a URL is credentials, not an address — and the
 * connection-string detector reports it far more precisely.
 */
function insideUrlAuthority(text: string, start: number): boolean {
  const lineStart = Math.max(
    text.lastIndexOf(' ', start),
    text.lastIndexOf('\n', start),
    text.lastIndexOf('\t', start),
  );

  return text.slice(lineStart + 1, start).includes('://');
}

export const emailDetector: Detector = {
  id: 'email',
  name: 'Email address',
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
      if (RESERVED_DOMAINS.test(value)) continue;
      if (insideUrlAuthority(text, start)) continue;

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
