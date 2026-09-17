import { describe, expect, it } from 'vitest';
import { jwtDetector } from './jwt';

const detect = (text: string) => jwtDetector.detect({ text, context: 'plain-text' });

// Header decodes to {"alg":"HS256","typ":"JWT"}.
const VALID =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

describe('jwtDetector', () => {
  it('finds a token and reports its algorithm', () => {
    const [finding] = detect(`Authorization: Bearer ${VALID}`);

    expect(finding?.label).toBe('JSON Web Token');
    expect(finding?.evidence).toContain('Header decodes to JSON with alg=HS256');
    expect(finding?.evidence).toContain('Header declares typ=JWT');
  });

  it('spans exactly the token', () => {
    const text = `token=${VALID};`;
    const [finding] = detect(text);

    expect(text.slice(finding?.span.start ?? 0, finding?.span.end ?? 0)).toBe(VALID);
  });

  it('accepts an unsigned token', () => {
    // {"alg":"none"} with an empty signature.
    const unsigned = 'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0.';
    expect(detect(unsigned)).toHaveLength(1);
  });

  it('is less confident about an unrecognised algorithm', () => {
    // {"alg":"WAT99"}
    const odd = 'eyJhbGciOiJXQVQ5OSJ9.eyJzdWIiOiIxIn0.abcdef';
    const [finding] = detect(odd);

    expect(finding?.confidence).toBeLessThan(0.9);
  });

  it('ignores dot-separated text that only resembles a token', () => {
    expect(detect('eyJhbGc.notbase64json.signature')).toHaveLength(0);
  });

  it('ignores a header that decodes to JSON without an algorithm', () => {
    // {"hello":"world"}
    expect(detect('eyJoZWxsbyI6IndvcmxkIn0.eyJzdWIiOiIxIn0.sig')).toHaveLength(0);
  });

  it('ignores a bare header with no payload or signature', () => {
    expect(detect('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')).toHaveLength(0);
  });

  it('ignores ordinary prose', () => {
    expect(detect('The deployment failed twice this morning.')).toHaveLength(0);
  });
});
