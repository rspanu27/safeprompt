import type { ContentContext } from '../types';

const TIMESTAMPED_LINE =
  /^(?:\[)?\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}|^(?:\[)?(?:TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\b/i;

/**
 * A function call on the right-hand side means it's code. A space in the value
 * means there is more than one assignment on the line, like `a=1 b=2`, which is
 * more likely a log line than config.
 */
const ASSIGNMENT_LINE = /^(?:export\s+)?[A-Za-z_][A-Za-z0-9_]*\s*=(?![=>])[ \t]*[^\s(]*$/;

const SQL_STATEMENT =
  /^\s*(?:SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+(?:TABLE|INDEX|DATABASE)|ALTER\s+TABLE|DROP\s+TABLE|BEGIN|COMMIT)\b/i;

const SQL_TOKEN =
  /\b(?:PRIMARY\s+KEY|FOREIGN\s+KEY|NOT\s+NULL|REFERENCES|VARCHAR|BIGSERIAL|SERIAL|TIMESTAMPTZ|TIMESTAMP|INTEGER|BIGINT|BOOLEAN|DEFAULT|VALUES|INNER\s+JOIN|LEFT\s+JOIN|WHERE|GROUP\s+BY)\b/i;

const STACK_FRAME = /^\s*(?:at\s+\S+|File\s+".*",\s+line\s+\d+|\w+\.\w+\([^)]*\.(?:java|kt):\d+\))/;

const STACK_HEADER = /^(?:Traceback \(most recent call last\):|Exception in thread|Caused by:)/m;

/**
 * Kept short on purpose. Keywords that are also common English words (`from`,
 * `if`, `for`, `class`, `private`, `return`) made ordinary sentences look like
 * code, so this only uses keywords that are rare in normal writing, plus
 * punctuation patterns.
 */
const CODE_TOKEN =
  /(?:^|[\s!(])(?:function|const|var|def|import|export)\b|=>|=\s*[A-Za-z_][\w.]*\(|\)\s*\{$|;\s*$|[{[]\s*$|^\s*[}\])]+[;,]?\s*$/;

/** Ignores blank lines, which say nothing about what the content is. */
function meaningfulLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
}

function fraction(lines: readonly string[], test: (line: string) => boolean): number {
  if (lines.length === 0) return 0;
  return lines.filter(test).length / lines.length;
}

/** Tries to parse it. A failed parse returns quickly, so this is cheap. */
function isJson(text: string): boolean {
  const trimmed = text.trim();
  if (!/^[[{]/.test(trimmed)) return false;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}

/** A statement alone could be prose; with column types and clauses it is SQL. */
function isSql(lines: readonly string[]): boolean {
  return (
    lines.some((l) => SQL_STATEMENT.test(l)) && fraction(lines, (l) => SQL_TOKEN.test(l)) >= 0.3
  );
}

/**
 * Work out what the pasted content is.
 *
 * Ordered by confidence rather than scored, because the categories overlap: a
 * stack trace contains code, and a log line can contain JSON. The first
 * confident answer wins, so the more specific tests run first.
 */
export function classifyContext(text: string): ContentContext {
  if (text.trim().length === 0) return 'plain-text';
  if (isJson(text)) return 'json';

  const lines = meaningfulLines(text);

  if (STACK_HEADER.test(text) || fraction(lines, (l) => STACK_FRAME.test(l)) >= 0.3) {
    return 'stack-trace';
  }

  if (fraction(lines, (l) => ASSIGNMENT_LINE.test(l)) >= 0.75) return 'env-file';
  if (isSql(lines)) return 'sql';
  if (fraction(lines, (l) => TIMESTAMPED_LINE.test(l)) >= 0.5) return 'log';
  if (fraction(lines, (l) => CODE_TOKEN.test(l)) >= 0.4) return 'source-code';

  return 'plain-text';
}
