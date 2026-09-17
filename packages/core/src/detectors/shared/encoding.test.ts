import { describe, expect, it } from 'vitest';
import { decodeBase64Url } from './encoding';

describe('decodeBase64Url', () => {
  it('decodes an unpadded JWT header', () => {
    expect(decodeBase64Url('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toBe(
      '{"alg":"HS256","typ":"JWT"}',
    );
  });

  it('decodes the url-safe alphabet', () => {
    // '-' and '_' stand in for '+' and '/'.
    expect(decodeBase64Url('Pz8_Pg')).toBe('???>');
  });

  it('rejects characters outside the alphabet', () => {
    expect(decodeBase64Url('not base64!')).toBeNull();
    expect(decodeBase64Url('eyJhbGci=')).toBeNull();
  });

  it('rejects input that decodes to non-ASCII bytes', () => {
    expect(decodeBase64Url('gICA')).toBeNull();
  });

  it('rejects empty input', () => {
    expect(decodeBase64Url('')).toBeNull();
  });
});
