import type { Finding } from '@safeprompt/core';

export interface MarkedSegment {
  readonly text: string;
  /** The detector that flagged this span, or null for ordinary text. */
  readonly detectorId: string | null;
}

/** Split the original text into flagged and unflagged runs, for highlighting. */
export function markSpans(text: string, findings: readonly Finding[]): MarkedSegment[] {
  const ordered = [...findings].sort((a, b) => a.span.start - b.span.start);
  const segments: MarkedSegment[] = [];
  let cursor = 0;

  for (const finding of ordered) {
    const { start, end } = finding.span;
    if (start < cursor) continue;
    if (start > cursor) segments.push({ text: text.slice(cursor, start), detectorId: null });
    segments.push({ text: text.slice(start, end), detectorId: finding.detectorId });
    cursor = end;
  }

  if (cursor < text.length) segments.push({ text: text.slice(cursor), detectorId: null });
  return segments;
}

/** `[DB_PASSWORD_1]` to `DB_PASSWORD`, the placeholder type a detector asked for. */
export function familyOf(token: string): string {
  return token.slice(1, token.lastIndexOf('_'));
}
