import type { Detector, Finding } from '../types';

const DOTTED_QUAD = /\b(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})\b/g;

/** Returns the RFC 1918 or link-local range an address belongs to, if any. */
function privateRange(octets: readonly number[]): string | null {
  const [a, b] = octets;
  if (a === undefined || b === undefined) return null;

  if (a === 10) return '10.0.0.0/8';
  if (a === 172 && b >= 16 && b <= 31) return '172.16.0.0/12';
  if (a === 192 && b === 168) return '192.168.0.0/16';
  if (a === 127) return '127.0.0.0/8 loopback';
  if (a === 169 && b === 254) return '169.254.0.0/16 link-local';
  if (a === 100 && b >= 64 && b <= 127) return '100.64.0.0/10 carrier-grade NAT';

  return null;
}

export const privateIpDetector: Detector = {
  id: 'private-ip',
  category: 'infrastructure',
  severity: 'medium',
  description: 'Private, loopback and link-local IPv4 addresses.',

  detect({ text }) {
    const findings: Finding[] = [];

    for (const match of text.matchAll(DOTTED_QUAD)) {
      const value = match[0];
      const start = match.index;
      if (value === undefined || start === undefined) continue;

      const octets = value.split('.').map(Number);
      // Rejects 999.1.1.1 and 010.0.0.1, which a regex alone would accept.
      if (octets.some((n) => n > 255) || /\b0\d/.test(value)) continue;

      const range = privateRange(octets);
      if (range === null) continue;

      findings.push({
        detectorId: 'private-ip',
        category: 'infrastructure',
        severity: 'medium',
        confidence: 0.85,
        span: { start, end: start + value.length },
        label: 'Private IP address',
        evidence: [`Falls inside ${range}`],
        redaction: { placeholder: 'IP' },
      });
    }

    return findings;
  },
};
