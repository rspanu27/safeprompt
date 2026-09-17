import { describe, expect, it } from 'vitest';
import { rehydrate } from './redaction/redact';
import { scanText } from './pipeline';

const JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';

/** The kind of thing someone actually pastes when asking why a deploy broke. */
const PASTE = [
  'Traceback (most recent call last):',
  '  File "app/db.py", line 42, in connect',
  'psycopg2.OperationalError: connection refused',
  '',
  'DATABASE_URL=postgres://svc_app:Hunter2Hunter2@db-prod-01.internal:5432/orders',
  'AWS_ACCESS_KEY_ID=AKIA2E0RZXQ7MLPKWV3B',
  'AWS_SECRET_ACCESS_KEY="kd93Jf8sLq2mXnB4vC7zR1tY6uI0pOaS5dFgHjKl"',
  `Authorization: Bearer ${JWT}`,
  'upstream 10.0.4.17 timed out',
  'reported by ops@acme.io',
].join('\n');

const SECRETS = [
  'Hunter2Hunter2',
  'AKIA2E0RZXQ7MLPKWV3B',
  'kd93Jf8sLq2mXnB4vC7zR1tY6uI0pOaS5dFgHjKl',
  JWT,
  '10.0.4.17',
  'ops@acme.io',
  'db-prod-01.internal',
];

describe('scanText on a realistic paste', () => {
  const result = scanText(PASTE);

  it('rates it critical', () => {
    expect(result.risk.level).toBe('critical');
    expect(result.risk.score).toBe(100);
  });

  it('finds every detector that should fire', () => {
    const detectors = new Set(result.findings.map((f) => f.detectorId));

    expect(detectors).toContain('database-url');
    expect(detectors).toContain('cloud-token');
    expect(detectors).toContain('password-assignment');
    expect(detectors).toContain('jwt');
    expect(detectors).toContain('private-ip');
    expect(detectors).toContain('email');
  });

  it('leaves no secret in the redacted output', () => {
    for (const secret of SECRETS) {
      expect(result.redacted).not.toContain(secret);
    }
  });

  it('keeps the surrounding text readable', () => {
    expect(result.redacted).toContain('psycopg2.OperationalError: connection refused');
    expect(result.redacted).toContain('DATABASE_URL=postgres://');
    expect(result.redacted).toContain(':5432/');
    expect(result.redacted).toContain('timed out');
  });

  it('explains the score, worst contribution first', () => {
    const [worst] = result.risk.breakdown;
    expect(worst?.severity).toBe('critical');
    expect(result.risk.breakdown.length).toBeGreaterThan(3);
  });

  it('round-trips back to the original', () => {
    expect(rehydrate(result.redacted, result.placeholders)).toBe(PASTE);
  });

  it('reports no overlapping findings', () => {
    for (let i = 1; i < result.findings.length; i += 1) {
      expect(result.findings[i]?.span.start).toBeGreaterThanOrEqual(
        result.findings[i - 1]?.span.end ?? 0,
      );
    }
  });
});

describe('scanText on content that only looks sensitive', () => {
  /** A README section — the classic false-positive source. */
  const DOCS = [
    '## Configuration',
    '',
    'Copy `.env.example` and fill in your own values:',
    '',
    'DATABASE_URL=postgres://user:password@localhost:5432/mydb',
    'API_KEY=your-api-key-here',
    'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
    'SECRET_KEY=<replace-me>',
    '',
    'The server listens on 0.0.0.0 and proxies to api.example.com.',
  ].join('\n');

  it('stays quiet', () => {
    const result = scanText(DOCS);

    expect(result.findings).toHaveLength(0);
    expect(result.risk.level).toBe('low');
    expect(result.redacted).toBe(DOCS);
  });
});
