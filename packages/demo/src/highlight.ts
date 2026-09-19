export interface Segment {
  readonly text: string;
  readonly token: boolean;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split redacted text so the placeholders can be styled.
 *
 * Only tokens the scan actually inserted are marked, so bracketed text that
 * happened to be in the paste is left alone.
 */
export function segment(redacted: string, tokens: Iterable<string>): Segment[] {
  const list = [...tokens].sort((a, b) => b.length - a.length);
  if (list.length === 0) return redacted.length === 0 ? [] : [{ text: redacted, token: false }];

  const pattern = new RegExp(list.map(escapeRegExp).join('|'), 'g');
  const segments: Segment[] = [];
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
