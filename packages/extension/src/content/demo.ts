/**
 * Stand-in for a real paste until adapters land in the next phase.
 *
 * The shell is built without paste interception on purpose: the browser
 * plumbing — manifest, injection, shadow DOM, React mounting, style isolation —
 * is worth debugging on its own, before adding editors that fight back.
 */
export const DEMO_PASTE = [
  'Traceback (most recent call last):',
  '  File "/srv/app/db.py", line 88, in connect',
  '    conn = psycopg2.connect(DATABASE_URL)',
  'psycopg2.OperationalError: FATAL: password authentication failed',
  '',
  'DATABASE_URL=postgres://svc_orders:Hq7Kd0Lm2Pn9@db-prod-01.internal:5432/orders',
  'AWS_ACCESS_KEY_ID=AKIA2E0RZXQ7MLPKWV3B',
  'upstream 10.0.4.17 timed out',
  'reported by oncall@acme.io',
].join('\n');
