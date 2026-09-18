import type { Detector, Finding } from '../types';
import { decodeBase64Url } from './shared/encoding';

/**
 * Anchored on `eyJ`, which is base64url for `{"` — every JWT header starts
 * with it. Cheap way to skip the many other dot-separated tokens in a paste.
 */
const CANDIDATE = /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]*/g;

const KNOWN_ALGORITHMS = new Set([
  'HS256',
  'HS384',
  'HS512',
  'RS256',
  'RS384',
  'RS512',
  'ES256',
  'ES384',
  'ES512',
  'PS256',
  'PS384',
  'PS512',
  'EdDSA',
  'none',
]);

interface Header {
  alg?: unknown;
  typ?: unknown;
}

/** Decode the header and confirm it's really a JWT rather than a lookalike. */
function inspectHeader(segment: string): { alg: string; typ: string | null } | null {
  const json = decodeBase64Url(segment);
  if (json === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null) return null;

  const { alg, typ } = parsed as Header;
  if (typeof alg !== 'string') return null;

  return { alg, typ: typeof typ === 'string' ? typ : null };
}

export const jwtDetector: Detector = {
  id: 'jwt',
  name: 'JSON Web Token',
  category: 'credential',
  severity: 'high',
  description: 'JSON Web Tokens, validated by decoding the header.',

  detect({ text }) {
    const findings: Finding[] = [];

    for (const match of text.matchAll(CANDIDATE)) {
      const value = match[0];
      const start = match.index;
      if (value === undefined || start === undefined) continue;

      const [headerSegment] = value.split('.');
      if (headerSegment === undefined) continue;

      const header = inspectHeader(headerSegment);
      if (header === null) continue;

      const evidence = [`Header decodes to JSON with alg=${header.alg}`];
      if (header.typ !== null) evidence.push(`Header declares typ=${header.typ}`);

      findings.push({
        detectorId: 'jwt',
        category: 'credential',
        severity: 'high',
        confidence: KNOWN_ALGORITHMS.has(header.alg) ? 0.99 : 0.8,
        span: { start, end: start + value.length },
        label: 'JSON Web Token',
        evidence,
        redaction: { placeholder: 'JWT' },
      });
    }

    return findings;
  },
};
