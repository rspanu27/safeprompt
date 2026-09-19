/**
 * A pattern needs at least this many characters besides `*`. A pattern like
 * `*` or `a*` would match almost everything and effectively turn the scanner
 * off, which is easy to do by accident and hard to notice afterwards.
 */
const MIN_LITERAL_CHARACTERS = 4;

/** Why a pattern would be rejected, or null if it is usable. */
export function allowlistPatternProblem(pattern: string): string | null {
  const trimmed = pattern.trim();
  if (trimmed.length === 0) return 'Empty pattern';

  const literal = trimmed.replaceAll('*', '');
  if (literal.length < MIN_LITERAL_CHARACTERS) {
    return `Needs at least ${MIN_LITERAL_CHARACTERS} characters besides *, or it would match almost anything`;
  }

  return null;
}

function toRegExp(pattern: string): RegExp {
  // Everything is escaped, then `*` is the only thing given meaning back. Users
  // never write a regular expression, so there is nothing to backtrack on.
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '.*');
  return new RegExp(`^${escaped}$`);
}

/** Build a matcher from the usable patterns. Case-sensitive, like secrets. */
export function compileAllowlist(patterns: readonly string[]): (value: string) => boolean {
  const compiled = patterns
    .map((p) => p.trim())
    .filter((p) => allowlistPatternProblem(p) === null)
    .map(toRegExp);

  if (compiled.length === 0) return () => false;
  return (value) => compiled.some((re) => re.test(value));
}
