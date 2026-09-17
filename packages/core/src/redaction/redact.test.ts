import { describe, expect, it } from 'vitest';
import { redact } from './redact';
import type { Finding } from '../types';

function finding(start: number, end: number, placeholder = 'EMAIL'): Finding {
  return {
    detectorId: 'test',
    category: 'pii',
    severity: 'low',
    confidence: 1,
    span: { start, end },
    label: 'Test finding',
    evidence: ['test'],
    redaction: { placeholder },
  };
}

/** Locate a substring and describe it as a finding, so tests read by value. */
function at(text: string, value: string, placeholder?: string): Finding {
  const start = text.indexOf(value);
  if (start < 0) throw new Error(`"${value}" is not in the fixture text`);
  return finding(start, start + value.length, placeholder);
}

describe('redact', () => {
  it('returns the input unchanged when there is nothing to redact', () => {
    const result = redact('nothing sensitive here', []);
    expect(result.text).toBe('nothing sensitive here');
    expect(result.placeholders.size).toBe(0);
  });

  it('replaces a span with a numbered placeholder', () => {
    const text = 'mail alice@corp.com now';
    const result = redact(text, [at(text, 'alice@corp.com')]);
    expect(result.text).toBe('mail [EMAIL_1] now');
  });

  it('gives the same value the same token everywhere it appears', () => {
    const text = 'alice@corp.com told alice@corp.com';
    const first = text.indexOf('alice@corp.com');
    const second = text.lastIndexOf('alice@corp.com');
    const result = redact(text, [finding(first, first + 14), finding(second, second + 14)]);

    expect(result.text).toBe('[EMAIL_1] told [EMAIL_1]');
    expect(result.placeholders.size).toBe(1);
  });

  it('gives distinct values distinct tokens', () => {
    const text = 'alice@corp.com and bob@corp.com';
    const result = redact(text, [at(text, 'alice@corp.com'), at(text, 'bob@corp.com')]);

    expect(result.text).toBe('[EMAIL_1] and [EMAIL_2]');
    expect(result.placeholders.get('[EMAIL_1]')).toBe('alice@corp.com');
    expect(result.placeholders.get('[EMAIL_2]')).toBe('bob@corp.com');
  });

  it('numbers each placeholder family independently', () => {
    const text = 'alice@corp.com at 10.0.0.1';
    const result = redact(text, [at(text, 'alice@corp.com'), at(text, '10.0.0.1', 'IP')]);

    expect(result.text).toBe('[EMAIL_1] at [IP_1]');
  });

  it('keeps offsets valid when a replacement is longer than what it replaces', () => {
    // The token is longer than the match, so a sequential replace would shift
    // every later span.
    const text = 'a@b.co then c@d.io then e@f.io';
    const result = redact(text, [at(text, 'a@b.co'), at(text, 'c@d.io'), at(text, 'e@f.io')]);

    expect(result.text).toBe('[EMAIL_1] then [EMAIL_2] then [EMAIL_3]');
  });

  it('leaks no redacted value into the output', () => {
    const text = 'key=alice@corp.com secret=bob@corp.com';
    const result = redact(text, [at(text, 'alice@corp.com'), at(text, 'bob@corp.com')]);

    for (const original of result.placeholders.values()) {
      expect(result.text).not.toContain(original);
    }
  });

  it('is unaffected by the order findings arrive in', () => {
    const text = 'a@b.co then c@d.io';
    const forwards = redact(text, [at(text, 'a@b.co'), at(text, 'c@d.io')]);
    const backwards = redact(text, [at(text, 'c@d.io'), at(text, 'a@b.co')]);

    expect(backwards.text).toBe(forwards.text);
  });

  it('skips a finding that overlaps one already applied', () => {
    const text = 'alice@corp.com';
    const result = redact(text, [finding(0, 14), finding(6, 14)]);

    expect(result.text).toBe('[EMAIL_1]');
  });

  it('does not lend one family another family’s token', () => {
    // Collapsing these would leave the UI reporting an IP finding that appears
    // nowhere in the redacted text.
    const result = redact('aa', [finding(0, 1, 'EMAIL'), finding(1, 2, 'IP')]);
    expect(result.text).toBe('[EMAIL_1][IP_1]');
  });

  it('redacts a span at the very start and end of the input', () => {
    const text = 'a@b.co';
    expect(redact(text, [at(text, 'a@b.co')]).text).toBe('[EMAIL_1]');
  });
});
