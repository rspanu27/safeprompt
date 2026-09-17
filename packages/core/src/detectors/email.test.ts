import { describe, expect, it } from 'vitest';
import { emailDetector } from './email';
import type { Finding } from '../types';

function detect(text: string): readonly Finding[] {
  return emailDetector.detect({ text, context: 'plain-text' });
}

/** Every finding must point at the text it claims to have matched. */
function matchedValues(text: string): string[] {
  return detect(text).map((f) => text.slice(f.span.start, f.span.end));
}

describe('emailDetector', () => {
  it('finds a plain address', () => {
    expect(matchedValues('contact raul@example.com for access')).toEqual(['raul@example.com']);
  });

  it('finds several addresses in one input', () => {
    expect(matchedValues('a@b.co, c@d.io and e@f.org')).toEqual(['a@b.co', 'c@d.io', 'e@f.org']);
  });

  it('handles subdomains and plus addressing', () => {
    expect(matchedValues('r.a.spanu+ci@student.tudelft.nl')).toEqual([
      'r.a.spanu+ci@student.tudelft.nl',
    ]);
  });

  it('reports spans that slice back to the matched value', () => {
    const text = 'from=alice@corp.com to=bob@corp.com';
    for (const finding of detect(text)) {
      expect(text.slice(finding.span.start, finding.span.end)).toContain('@');
    }
  });

  it('ignores text that only looks address-like', () => {
    expect(detect('no domain here@ or @there, and user@localhost')).toHaveLength(0);
  });

  it('describes why it fired', () => {
    const [finding] = detect('someone@example.com');
    expect(finding?.evidence).not.toHaveLength(0);
  });

  it('classifies addresses as low-severity PII', () => {
    const [finding] = detect('someone@example.com');
    expect(finding?.category).toBe('pii');
    expect(finding?.severity).toBe('low');
  });
});
