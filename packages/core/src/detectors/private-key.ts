import type { Detector, Finding } from '../types';

/** The END marker is back-referenced, so a block must close with the type it opened. */
const PEM_BLOCK =
  /-----BEGIN ((?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?)-----[\s\S]*?-----END \1-----/g;

/** A truncated paste still leaks most of the key, and still needs flagging. */
const BEGIN_MARKER = /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/g;

export const privateKeyDetector: Detector = {
  id: 'private-key',
  name: 'Private key',
  category: 'secret',
  severity: 'critical',
  description: 'PEM-encoded private keys, including RSA, EC, OpenSSH and PGP.',

  detect({ text }) {
    const findings: Finding[] = [];

    const push = (start: number, end: number, confidence: number, evidence: string): void => {
      findings.push({
        detectorId: 'private-key',
        category: 'secret',
        severity: 'critical',
        confidence,
        span: { start, end },
        label: 'Private key',
        evidence: [evidence],
        redaction: { placeholder: 'PRIVATE_KEY' },
      });
    };

    for (const match of text.matchAll(PEM_BLOCK)) {
      const value = match[0];
      const start = match.index;
      const kind = match[1];
      if (value === undefined || start === undefined) continue;

      push(start, start + value.length, 1, `Complete PEM block: ${kind ?? 'private key'}`);
    }

    // Resolution drops these wherever a complete block already covers them.
    for (const match of text.matchAll(BEGIN_MARKER)) {
      const value = match[0];
      const start = match.index;
      if (value === undefined || start === undefined) continue;

      push(start, start + value.length, 0.85, 'PEM header with no matching END marker');
    }

    return findings;
  },
};
