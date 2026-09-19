import { describe, expect, it } from 'vitest';
import { segment } from './highlight';

describe('segment', () => {
  it('marks the placeholders the scan inserted', () => {
    expect(segment('key=[SECRET_1] host=[HOST_1]', ['[SECRET_1]', '[HOST_1]'])).toEqual([
      { text: 'key=', token: false },
      { text: '[SECRET_1]', token: true },
      { text: ' host=', token: false },
      { text: '[HOST_1]', token: true },
    ]);
  });

  it('leaves bracketed text alone when the scan did not insert it', () => {
    expect(segment('see [NOTE_1] above', [])).toEqual([
      { text: 'see [NOTE_1] above', token: false },
    ]);
  });

  it('does not match a shorter token inside a longer one', () => {
    const parts = segment('[EMAIL_10] and [EMAIL_1]', ['[EMAIL_1]', '[EMAIL_10]']);
    expect(parts.filter((p) => p.token).map((p) => p.text)).toEqual(['[EMAIL_10]', '[EMAIL_1]']);
  });

  it('reassembles to the original text', () => {
    const text = '[A_1]middle[B_1]';
    expect(
      segment(text, ['[A_1]', '[B_1]'])
        .map((p) => p.text)
        .join(''),
    ).toBe(text);
  });

  it('returns nothing for empty text', () => {
    expect(segment('', [])).toEqual([]);
  });
});
