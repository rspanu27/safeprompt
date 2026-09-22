export interface RedactedSegment {
  readonly text: string;
  /** True when this run is a placeholder the scan inserted. */
  readonly token: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split redacted text into plain runs and placeholders, so a UI can style them.
 *
 * Only tokens the scan actually inserted are marked, so bracketed text that was
 * already in the paste is left alone. Longer tokens are tried first, so
 * `[EMAIL_1]` never matches inside `[EMAIL_10]`.
 */
export function splitRedacted(redacted: string, tokens: Iterable<string>): RedactedSegment[] {
  const list = [...tokens].sort((a, b) => b.length - a.length);
  if (list.length === 0) return redacted.length === 0 ? [] : [{ text: redacted, token: false }];

  const pattern = new RegExp(list.map(escapeRegExp).join('|'), 'g');
  const segments: RedactedSegment[] = [];
  let cursor = 0;

  for (const match of redacted.matchAll(pattern)) {
    const start = match.index;
    if (start > cursor) segments.push({ text: redacted.slice(cursor, start), token: false });
    segments.push({ text: match[0], token: true });
    cursor = start + match[0].length;
  }

  if (cursor < redacted.length) segments.push({ text: redacted.slice(cursor), token: false });
  return segments;
}
