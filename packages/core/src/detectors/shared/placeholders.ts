/**
 * Recognise dummy values.
 *
 * Documentation, READMEs and config templates are full of things shaped exactly
 * like credentials, and they are the single largest source of false positives.
 * Every detector that matches a free-form value should run it past this first.
 */

const EXACT = new Set([
  'changeme',
  'placeholder',
  'password',
  'password123',
  'secret',
  'string',
  'todo',
  'tbd',
  'none',
  'null',
  'nil',
  'undefined',
  'example',
  'test',
  'dummy',
  'redacted',
  'hidden',
  'sensitive',
]);

const SUBSTRINGS = [
  'your-',
  'your_',
  'yourapi',
  'my-secret',
  'insert-',
  'replace-',
  'example.com',
  'examplekey',
  'notarealkey',
  'fake',
  'sample',
  'dummy',
  'placeholder',
  'redacted',
  'xxxxx',
  'aaaaa',
  '12345678',
  'abcdef123456',
];

/** Well-known values published in vendor documentation. */
const KNOWN_DOC_VALUES = new Set([
  'AKIAIOSFODNN7EXAMPLE',
  'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
]);

/** `<token>`, `{{token}}`, `${TOKEN}`, `%TOKEN%`, `[token]`. */
const TEMPLATE = /^(?:<.*>|\{\{.*\}\}|\$\{.*\}|%.*%|\[.*\])$/;

/** `process.env.X`, `os.getenv("X")`, `ENV["X"]` — a reference, not a value. */
const ENV_REFERENCE = /(?:process\s*\.\s*env|getenv|ENV\s*\[|Deno\s*\.\s*env)/i;

export function isPlaceholder(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;

  if (KNOWN_DOC_VALUES.has(trimmed)) return true;

  const lower = trimmed.toLowerCase();
  if (EXACT.has(lower)) return true;
  if (TEMPLATE.test(trimmed)) return true;
  if (ENV_REFERENCE.test(trimmed)) return true;
  if (SUBSTRINGS.some((needle) => lower.includes(needle))) return true;

  // A single repeated character, e.g. 'xxxxxxxx' or '00000000'.
  if (trimmed.length > 3 && new Set(trimmed).size === 1) return true;

  return false;
}
