import { scanText } from '@safeprompt/core';
import { describe, expect, it } from 'vitest';
import { familyOf, markSpans } from './highlight';

describe('familyOf', () => {
  it('drops the brackets and the number', () => {
    expect(familyOf('[DB_PASSWORD_12]')).toBe('DB_PASSWORD');
  });
});

describe('markSpans', () => {
  it('marks each finding with the detector that found it', () => {
    const text = 'ping dana@acme.io now';
    const parts = markSpans(text, scanText(text).findings);

    expect(parts).toEqual([
      { text: 'ping ', detectorId: null },
      { text: 'dana@acme.io', detectorId: 'email' },
      { text: ' now', detectorId: null },
    ]);
  });

  it('reassembles to the original text', () => {
    const text = 'DATABASE_URL=postgres://svc:Hq7Kd0Lm2Pn9@db.internal:5432/orders';
    const parts = markSpans(text, scanText(text).findings);

    expect(parts.map((p) => p.text).join('')).toBe(text);
  });

  it('returns the whole text unmarked when nothing was found', () => {
    expect(markSpans('hello', [])).toEqual([{ text: 'hello', detectorId: null }]);
  });

  it('returns nothing for empty text', () => {
    expect(markSpans('', [])).toEqual([]);
  });
});
