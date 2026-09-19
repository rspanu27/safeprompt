/**
 * Starting points for someone who has nothing to hand. Every credential here is
 * made up; the shapes are real, the values open nothing.
 */
export interface Sample {
  readonly id: string;
  readonly label: string;
  readonly text: string;
}

const JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';

export const SAMPLES: readonly Sample[] = [
  {
    id: 'env',
    label: '.env file',
    text: [
      'DATABASE_URL=postgres://svc_orders:Hq7Kd0Lm2Pn9@db-prod-01.internal:5432/orders',
      'REDIS_URL=redis://cache-02.internal:6379/1',
      'STRIPE_SECRET_KEY=sk_live_51H8xQ2KdLmNpQrStUvWx',
      'AWS_ACCESS_KEY_ID=AKIA2E0RZXQ7MLPKWV3B',
      'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI4K7MDENGbPxRfiCYbMh2QwErTyU',
    ].join('\n'),
  },
  {
    id: 'trace',
    label: 'Stack trace',
    text: [
      'Traceback (most recent call last):',
      '  File "/srv/app/db.py", line 88, in connect',
      '    return psycopg2.connect("postgres://reporting:Vb6Nm1Qa4Z@warehouse.internal/analytics")',
      'psycopg2.OperationalError: FATAL: password authentication failed for user "reporting"',
    ].join('\n'),
  },
  {
    id: 'log',
    label: 'Production log',
    text: [
      '2026-03-02T11:04:19Z ERROR upstream 192.168.14.22 returned 503',
      '2026-03-02T11:04:19Z INFO  retrying via gateway.corp',
      `2026-03-02T11:04:20Z DEBUG request authorised with ${JWT}`,
      '2026-03-02T11:04:20Z WARN  paging oncall@acme.io',
    ].join('\n'),
  },
  {
    id: 'readme',
    label: 'README (stays quiet)',
    text: [
      '## Configuration',
      '',
      'Copy `.env.example` to `.env` and fill in your own values:',
      '',
      'DATABASE_URL=postgres://user:password@localhost:5432/mydb',
      'API_KEY=your-api-key-here',
      'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
    ].join('\n'),
  },
];
