import type { Sample } from './types';

/**
 * Everything here must produce zero findings.
 *
 * This half of the corpus decides the false-positive rate, and a scanner that
 * cries wolf on a README gets switched off within a day.
 */
function negative(id: string, text: string, note?: string): Sample {
  return note === undefined ? { id, text, expected: [] } : { id, text, expected: [], note };
}

export const NEGATIVES: readonly Sample[] = [
  negative(
    'neg-readme-configuration',
    [
      '## Configuration',
      '',
      'Copy `.env.example` to `.env` and fill in your values:',
      '',
      'DATABASE_URL=postgres://user:password@localhost:5432/mydb',
      'API_KEY=your-api-key-here',
      'SECRET_KEY=<replace-with-your-own>',
      'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE',
    ].join('\n'),
    'Setup instructions are the single largest false-positive source.',
  ),
  negative(
    'neg-env-references',
    [
      'const client = new Client({',
      '  password: process.env.DB_PASSWORD,',
      '  apiKey: os.getenv("API_KEY"),',
      '});',
    ].join('\n'),
    'References to secrets, not secrets.',
  ),
  negative(
    'neg-template-placeholders',
    'password: ${DB_PASSWORD}\napi_key: {{ vault.api_key }}\nclient_secret: %CLIENT_SECRET%',
  ),
  negative(
    'neg-git-log',
    [
      'commit 9f8c3b1d2e4a5f6b7c8d9e0f1a2b3c4d5e6f7a8b',
      'Author: Dana Lee <dana@example.com>',
      'Date:   Mon Mar 2 09:14:22 2026 +0100',
      '',
      '    Bump parser to 4.18.2',
    ].join('\n'),
    'Commit hashes are 40 hex characters, exactly like many secrets.',
  ),
  negative(
    'neg-uuids',
    'trace_id=3f2504e0-4f89-11d3-9a0c-0305e82c3301 span=b7e2c1a4-9d3f-4c8e-a1b2-c3d4e5f60718',
  ),
  negative(
    'neg-semver-and-versions',
    'Upgraded from 4.18.2 to 5.0.1; protocol version 1.2.3.4 remains supported.',
  ),
  negative('neg-public-ips', 'Resolved via 8.8.8.8, failing over to 1.1.1.1 and 208.67.222.222.'),
  negative(
    'neg-invalid-ips',
    'Matrix dimensions 999.168.1.1 and octal-looking 010.0.0.1 are not addresses.',
  ),
  negative(
    'neg-public-domains',
    'See docs.python.org and status.github.com; mirrors at cdn.example.com.',
  ),
  negative(
    'neg-base64-image',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'Long base64 that is not a credential.',
  ),
  negative(
    'neg-minified-js',
    '!function(e,t){"object"==typeof exports?module.exports=t():e.lib=t()}(this,function(){return{version:"2.4.1"}});',
  ),
  negative(
    'neg-lorem-ipsum',
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.',
  ),
  negative(
    'neg-sql-schema',
    [
      'CREATE TABLE users (',
      '  id BIGSERIAL PRIMARY KEY,',
      '  password_hash TEXT NOT NULL,',
      '  created_at TIMESTAMPTZ DEFAULT now()',
      ');',
    ].join('\n'),
    'A column named password_hash is a schema, not a secret.',
  ),
  negative(
    'neg-stack-trace-clean',
    [
      'TypeError: Cannot read properties of undefined (reading "map")',
      '    at renderRows (app/table.tsx:118:22)',
      '    at renderWithHooks (react-dom.development.js:16305:18)',
    ].join('\n'),
  ),
  negative(
    'neg-prose-about-secrets',
    'Rotate the production password if you think it leaked, and never paste your private key into a chat window.',
  ),
  negative(
    'neg-public-key',
    '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE\n-----END PUBLIC KEY-----',
  ),
  negative(
    'neg-certificate',
    '-----BEGIN CERTIFICATE-----\nMIIDdzCCAl+gAwIBAgIEAgAAuTANBgkqhkiG9w0BAQUFADBa\n-----END CERTIFICATE-----',
  ),
  negative(
    'neg-stripe-publishable-key',
    'Stripe.setPublishableKey("pk_live_51H8xQ2KdLmNpQrStUvWx");',
    'Publishable keys are designed to ship to the browser.',
  ),
  negative(
    'neg-localhost-connection-strings',
    'redis://localhost:6379/0 and postgres://127.0.0.1:5432/dev are the defaults.',
  ),
  negative(
    'neg-http-urls',
    'POST https://api.example.com/v1/postgres://not-a-db and https://example.com/mysql',
  ),
  negative(
    'neg-repeated-character-dummies',
    'password = "xxxxxxxxxxxx"\napi_key = "aaaaaaaaaaaaaaaa"\ntoken = "000000000000"',
  ),
  negative(
    'neg-short-identifiers',
    'password = pw\nsecret = s\napi_key = k',
    'Short bare values are variable names far more often than secrets.',
  ),
  negative('neg-hex-colors-and-ids', 'Theme uses #1a2b3c and #ff00aa; order ref 9F8C3B1D2E4A5F6B.'),
  negative(
    'neg-jwt-lookalike',
    'segments.separated.bydots and eyJhbGc.notvalidjson.signature',
    'Starts like a JWT but the header does not decode to JSON.',
  ),
  negative(
    'neg-package-lock-integrity',
    '"integrity": "sha512-Cd4ZZwOWjEDA1mNpQrStUvWxYzAbCdEfGhIjKlMnOpQrStUvWxYzAbCdEfGh=="',
    'Lockfile integrity hashes look exactly like secrets.',
  ),
  negative(
    'neg-documentation-example-values',
    'Set token to notarealkey-sample-value and host to db.example.com.',
  ),
];
