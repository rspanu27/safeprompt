import type { Sample } from './types';

const JWT_HS256 =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ';
const JWT_RS256 =
  'eyJhbGciOiJSUzI1NiIsImtpZCI6ImFiYzEyMyJ9.eyJpc3MiOiJhY21lIiwiZXhwIjoxNzAwMDAwMDAwfQ.QWJjRGVmR2hJaktsTW5PcFFyU3RVdld4WXpBYkNkRWZHaElqS2xNbk9wUXI';

const RSA_KEY = [
  '-----BEGIN RSA PRIVATE KEY-----',
  'MIIEowIBAAKCAQEAx4fmHy6Yw1kQ0nFvKPRlpVvFQ2mZ8kXqL3nT7bJcYdWwGpAs',
  'RtZvNhKuEiMoPqLsXyBcDfGhJkLmNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWx',
  'YzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGhIj',
  '-----END RSA PRIVATE KEY-----',
].join('\n');

const OPENSSH_KEY = [
  '-----BEGIN OPENSSH PRIVATE KEY-----',
  'b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdz',
  'c2gtcn NhAAAAAwEAAQAAAYEAvBnQ2xMZ1kQ0nFvKPRlpVvFQ2mZ8kXqL3nT7bJcY',
  '-----END OPENSSH PRIVATE KEY-----',
].join('\n');

export const POSITIVES: readonly Sample[] = [
  {
    id: 'pos-env-file',
    text: [
      'DATABASE_URL=postgres://svc_orders:Hq7Kd0Lm2Pn9@db-prod-01.internal:5432/orders',
      'REDIS_URL=redis://cache-02.internal:6379/1',
      'STRIPE_SECRET_KEY=sk_live_51H8xQ2KdLmNpQrStUvWx',
      'SENTRY_DSN=https://abc123@o12345.ingest.sentry.io/678',
    ].join('\n'),
    expected: [
      { detectorId: 'database-url', value: 'svc_orders' },
      { detectorId: 'database-url', value: 'Hq7Kd0Lm2Pn9' },
      { detectorId: 'database-url', value: 'db-prod-01.internal' },
      { detectorId: 'database-url', value: 'orders' },
      { detectorId: 'database-url', value: 'cache-02.internal' },
      { detectorId: 'cloud-token', value: 'sk_live_51H8xQ2KdLmNpQrStUvWx' },
      { detectorId: 'password-assignment', value: 'sk_live_51H8xQ2KdLmNpQrStUvWx' },
      { detectorId: 'internal-hostname', value: 'db-prod-01.internal' },
      { detectorId: 'internal-hostname', value: 'cache-02.internal' },
    ],
    note: 'The archetypal paste: a whole .env file.',
  },
  {
    id: 'pos-aws-credentials-file',
    text: [
      '[default]',
      'aws_access_key_id = AKIA2E0RZXQ7MLPKWV3B',
      'aws_secret_access_key = wJalrXUtnFEMI4K7MDENGbPxRfiCYbMh2QwErTyU',
      'region = eu-west-1',
    ].join('\n'),
    expected: [
      { detectorId: 'cloud-token', value: 'AKIA2E0RZXQ7MLPKWV3B' },
      {
        detectorId: 'password-assignment',
        value: 'wJalrXUtnFEMI4K7MDENGbPxRfiCYbMh2QwErTyU',
      },
    ],
  },
  {
    id: 'pos-rsa-private-key',
    text: `Here's the deploy key that stopped working:\n\n${RSA_KEY}\n`,
    expected: [{ detectorId: 'private-key', value: RSA_KEY }],
  },
  {
    id: 'pos-openssh-private-key',
    text: OPENSSH_KEY,
    expected: [{ detectorId: 'private-key', value: OPENSSH_KEY }],
  },
  {
    id: 'pos-truncated-private-key',
    text: '-----BEGIN EC PRIVATE KEY-----\nMHcCAQEEIJ8Xy2K4mNpQrStUvWxYzAbCdEfGh',
    expected: [{ detectorId: 'private-key', value: '-----BEGIN EC PRIVATE KEY-----' }],
    note: 'Truncated pastes are common and still leak most of the key.',
  },
  {
    id: 'pos-jwt-authorization-header',
    text: `curl -H "Authorization: Bearer ${JWT_HS256}" https://api.acme.io/v1/orders`,
    expected: [{ detectorId: 'jwt', value: JWT_HS256 }],
  },
  {
    id: 'pos-jwt-in-json',
    text: `{"access_token": "${JWT_RS256}", "expires_in": 3600}`,
    expected: [
      { detectorId: 'jwt', value: JWT_RS256 },
      { detectorId: 'password-assignment', value: JWT_RS256 },
    ],
  },
  {
    id: 'pos-github-token',
    text: 'git remote set-url origin https://ghp_16C7e42F292c6912E7710c838347Ae178B4a@github.com/acme/api.git',
    expected: [{ detectorId: 'cloud-token', value: 'ghp_16C7e42F292c6912E7710c838347Ae178B4a' }],
  },
  {
    id: 'pos-slack-token',
    text: 'SLACK_BOT_TOKEN=xoxb-2451234567-2451234567-AbCdEfGhIjKlMnOpQrStUvWx',
    expected: [
      { detectorId: 'cloud-token', value: 'xoxb-2451234567-2451234567-AbCdEfGhIjKlMnOpQrStUvWx' },
    ],
  },
  {
    id: 'pos-openai-key',
    text: 'client = OpenAI(api_key="sk-proj-9dKmNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUv")',
    expected: [
      { detectorId: 'cloud-token', value: 'sk-proj-9dKmNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUv' },
      {
        detectorId: 'password-assignment',
        value: 'sk-proj-9dKmNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUv',
      },
    ],
    note: 'Both detectors legitimately fire; resolution picks one at pipeline level.',
  },
  {
    id: 'pos-mongodb-srv',
    text: 'mongodb+srv://analytics:Rt4Yu8Iop2@cluster0.k3x9z.mongodb.net/events?retryWrites=true',
    expected: [
      { detectorId: 'database-url', value: 'analytics' },
      { detectorId: 'database-url', value: 'Rt4Yu8Iop2' },
      { detectorId: 'database-url', value: 'cluster0.k3x9z.mongodb.net' },
      { detectorId: 'database-url', value: 'events' },
    ],
  },
  {
    id: 'pos-mysql-with-private-host',
    text: 'mysql://root:Zx9Cv2Bn5M@10.0.4.17:3306/billing',
    expected: [
      { detectorId: 'database-url', value: 'root' },
      { detectorId: 'database-url', value: 'Zx9Cv2Bn5M' },
      { detectorId: 'database-url', value: '10.0.4.17' },
      { detectorId: 'database-url', value: 'billing' },
      { detectorId: 'private-ip', value: '10.0.4.17' },
    ],
  },
  {
    id: 'pos-python-config',
    text: [
      'DATABASES = {',
      '    "default": {',
      '        "USER": "app_rw",',
      '        "PASSWORD": "Jm3Kd8Ls0Qw7",',
      '        "HOST": "postgres.internal",',
      '    }',
      '}',
    ].join('\n'),
    expected: [
      { detectorId: 'password-assignment', value: 'Jm3Kd8Ls0Qw7' },
      { detectorId: 'internal-hostname', value: 'postgres.internal' },
    ],
  },
  {
    id: 'pos-yaml-secrets',
    text: [
      'apiVersion: v1',
      'kind: Secret',
      'stringData:',
      '  client_secret: 8f3a9c2e1b7d4f6a0e5c',
      '  api_key: live_Kd93Jf8sLq2mXnB4',
    ].join('\n'),
    expected: [
      { detectorId: 'password-assignment', value: '8f3a9c2e1b7d4f6a0e5c' },
      { detectorId: 'password-assignment', value: 'live_Kd93Jf8sLq2mXnB4' },
    ],
  },
  {
    id: 'pos-production-log',
    text: [
      '2026-03-02T11:04:19Z ERROR upstream 192.168.14.22 returned 503',
      '2026-03-02T11:04:19Z INFO  retrying via gateway.corp',
      '2026-03-02T11:04:20Z WARN  notifying oncall@acme.io',
    ].join('\n'),
    expected: [
      { detectorId: 'private-ip', value: '192.168.14.22' },
      { detectorId: 'internal-hostname', value: 'gateway.corp' },
      { detectorId: 'email', value: 'oncall@acme.io' },
    ],
  },
  {
    id: 'pos-kubernetes-service',
    text: 'upstream connect error to payments.default.svc.cluster.local:8080',
    expected: [{ detectorId: 'internal-hostname', value: 'payments.default.svc.cluster.local' }],
  },
  {
    id: 'pos-stack-trace-with-credentials',
    text: [
      'Traceback (most recent call last):',
      '  File "/srv/app/db.py", line 88, in connect',
      '    return psycopg2.connect("postgres://reporting:Vb6Nm1Qa4Z@warehouse.internal/analytics")',
      'psycopg2.OperationalError: FATAL: password authentication failed',
    ].join('\n'),
    expected: [
      { detectorId: 'database-url', value: 'reporting' },
      { detectorId: 'database-url', value: 'Vb6Nm1Qa4Z' },
      { detectorId: 'database-url', value: 'warehouse.internal' },
      { detectorId: 'database-url', value: 'analytics' },
      { detectorId: 'internal-hostname', value: 'warehouse.internal' },
    ],
  },
  {
    id: 'pos-multiple-emails',
    text: 'CC: alice.brown@acme.io, bob@partner.co.uk, carol+billing@acme.io',
    expected: [
      { detectorId: 'email', value: 'alice.brown@acme.io' },
      { detectorId: 'email', value: 'bob@partner.co.uk' },
      { detectorId: 'email', value: 'carol+billing@acme.io' },
    ],
  },
  {
    id: 'pos-private-ip-ranges',
    text: 'hosts: 10.2.0.9, 172.20.3.4, 192.168.0.11, 169.254.169.254',
    expected: [
      { detectorId: 'private-ip', value: '10.2.0.9' },
      { detectorId: 'private-ip', value: '172.20.3.4' },
      { detectorId: 'private-ip', value: '192.168.0.11' },
      { detectorId: 'private-ip', value: '169.254.169.254' },
    ],
    note: '169.254.169.254 is the cloud metadata endpoint.',
  },
  {
    id: 'pos-dotenv-mixed-case',
    text: 'db_password=Wq2Er4Ty6Ui8\nAPI_KEY=Zx3Cv5Bn7Mk9Qw1E',
    expected: [
      { detectorId: 'password-assignment', value: 'Wq2Er4Ty6Ui8' },
      { detectorId: 'password-assignment', value: 'Zx3Cv5Bn7Mk9Qw1E' },
    ],
  },
  {
    id: 'pos-terraform-variable',
    text: 'variable "db_password" {\n  default = "Pl0kMj9Nh8Bg7"\n}',
    expected: [{ detectorId: 'password-assignment', value: 'Pl0kMj9Nh8Bg7' }],
  },
  {
    id: 'pos-connection-string-in-prose',
    text: 'It works locally but not in staging: postgres://deploy:Ax7Sd2Fg5H@10.1.1.8:5432/staging',
    expected: [
      { detectorId: 'database-url', value: 'deploy' },
      { detectorId: 'database-url', value: 'Ax7Sd2Fg5H' },
      { detectorId: 'database-url', value: '10.1.1.8' },
      { detectorId: 'database-url', value: 'staging' },
      { detectorId: 'private-ip', value: '10.1.1.8' },
    ],
  },
  {
    id: 'pos-stripe-test-key',
    text: 'STRIPE_TEST_KEY=sk_test_51H8xQ2KdLmNpQrStUvWx',
    expected: [{ detectorId: 'cloud-token', value: 'sk_test_51H8xQ2KdLmNpQrStUvWx' }],
    note: 'Lower severity than a live key, but still a secret.',
  },
];
