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
      description: 'Finds nothing.',
      detect: () => [],
    };

    const result = scanText('alice@corp.com', { detectors: [noop] });

    expect(result.findings).toHaveLength(0);
    expect(result.redacted).toBe('alice@corp.com');
  });

  it('reports the classified context', () => {
    expect(scanText('hello').context).toBe('plain-text');
  });
});
