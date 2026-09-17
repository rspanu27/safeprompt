import { describe, expect, it } from 'vitest';
import { passwordAssignmentDetector } from './password-assignment';

const detect = (text: string) => passwordAssignmentDetector.detect({ text, context: 'plain-text' });

const values = (text: string) => detect(text).map((f) => text.slice(f.span.start, f.span.end));

describe('passwordAssignmentDetector', () => {
  it('spans the value, not the whole assignment', () => {
    expect(values('password = "Tr0ub4dor&3"')).toEqual(['Tr0ub4dor&3']);
  });

  it('handles env-file, YAML and single-quoted forms', () => {
    expect(values('DB_PASSWORD=sup3rs3cretvalue')).toEqual(['sup3rs3cretvalue']);
    expect(values('client_secret: 8f3a9c2e1b7d4f6a')).toEqual(['8f3a9c2e1b7d4f6a']);
    expect(values("api_key = 'live_9f8e7d6c5b4a'")).toEqual(['live_9f8e7d6c5b4a']);
  });

  it('is less confident about unquoted values', () => {
    const [quoted] = detect('password = "Tr0ub4dor&3"');
    const [bare] = detect('password=Tr0ub4dor3xyz');

    expect((bare?.confidence ?? 1) < (quoted?.confidence ?? 0)).toBe(true);
  });

  it('ignores documentation placeholders', () => {
    expect(detect('password = "your-password-here"')).toHaveLength(0);
    expect(detect('api_key = "<YOUR_API_KEY>"')).toHaveLength(0);
    expect(detect('password = "xxxxxxxxxx"')).toHaveLength(0);
    expect(detect('password = "changeme"')).toHaveLength(0);
  });

  it('ignores references to environment variables', () => {
    expect(detect('password = process.env.DB_PASSWORD')).toHaveLength(0);
    expect(detect('api_key = os.getenv("API_KEY")')).toHaveLength(0);
    expect(detect('password: ${DB_PASSWORD}')).toHaveLength(0);
  });

  it('ignores a short bare value, which is usually an identifier', () => {
    expect(detect('password = pw')).toHaveLength(0);
  });

  it('ignores prose containing the word password', () => {
    expect(detect('Reset your password if you think it leaked.')).toHaveLength(0);
  });
});
