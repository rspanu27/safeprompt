import { describe, expect, it } from 'vitest';
import { scanText } from './pipeline';
import type { Detector } from './types';

describe('scanText', () => {
  it('reports nothing for text with no sensitive content', () => {
    const result = scanText('The build failed after the third retry.');

    expect(result.findings).toHaveLength(0);
    expect(result.risk.score).toBe(0);
    expect(result.redacted).toBe('The build failed after the third retry.');
  });

  it('runs detection, scoring, and redaction end to end', () => {
    const result = scanText('ping alice@corp.com about the outage');

    expect(result.findings).toHaveLength(1);
    expect(result.risk.score).toBeGreaterThan(0);
    expect(result.redacted).toBe('ping [EMAIL_1] about the outage');
    expect(result.placeholders.get('[EMAIL_1]')).toBe('alice@corp.com');
  });

  it('returns findings ordered by position in the input', () => {
    const result = scanText('c@d.io came after a@b.co only alphabetically');
    const starts = result.findings.map((f) => f.span.start);

    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it('leaves the input string untouched', () => {
    const input = 'alice@corp.com';
    scanText(input);
    expect(input).toBe('alice@corp.com');
  });

  it('accepts an explicit detector set', () => {
    const noop: Detector = {
      id: 'noop',
      category: 'secret',
      severity: 'critical',
      name: 'No-op',
      description: 'Finds nothing.',
      detect: () => [],
    };

    const result = scanText('alice@corp.com', { detectors: [noop] });

    expect(result.findings).toHaveLength(0);
    expect(result.redacted).toBe('alice@corp.com');
  });

  it('drops findings in a disabled category', () => {
    const result = scanText('ping alice@acme.io at 10.0.4.17', { categories: ['infrastructure'] });

    expect(result.findings.map((f) => f.detectorId)).toEqual(['private-ip']);
    expect(result.redacted).toContain('alice@acme.io');
  });

  it('leaves allowlisted values alone', () => {
    const result = scanText('db at staging-db.internal and prod-db.internal', {
      allowlist: ['staging-*.internal'],
    });

    expect(result.redacted).toContain('staging-db.internal');
    expect(result.redacted).not.toContain('prod-db.internal');
  });

  it('lets a finding surface when the category that would absorb it is disabled', () => {
    // The connection string's host normally absorbs the internal-hostname
    // finding on the same span. Filtering after resolution would drop both.
    const text = 'postgres://app:Hq7Kd0Lm2Pn9@db.internal:5432/orders';
    const result = scanText(text, { categories: ['infrastructure'] });

    expect(result.findings.map((f) => f.detectorId)).toEqual(['internal-hostname']);
    expect(result.redacted).toContain('[HOST_1]');
  });

  it('reports the classified context', () => {
    expect(scanText('hello').context).toBe('plain-text');
  });
});
