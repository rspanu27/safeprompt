import type { ScanResult } from '@safeprompt/core';
import { z } from 'zod';
import type { StorageArea } from '../storage/area';

const KEY = 'history';

/** Enough to be useful, small enough that storage never has to think about it. */
export const HISTORY_LIMIT = 200;

export type PasteAction = 'redacted' | 'original' | 'cancelled';

const entrySchema = z.object({
  at: z.number(),
  site: z.string(),
  level: z.enum(['low', 'medium', 'high', 'critical']),
  score: z.number(),
  detectors: z.record(z.string(), z.number()),
  action: z.enum(['redacted', 'original', 'cancelled']),
});

/**
 * A record of what happened, without any of the pasted text.
 *
 * It stores no values, snippets or URLs. The site is saved as the adapter id
 * instead of the page address, because conversation URLs contain their own
 * identifiers. If the history stored pasted text, it would become another place
 * where the user's secrets are kept.
 */
export type HistoryEntry = z.infer<typeof entrySchema>;

export function historyEntry(
  result: ScanResult,
  site: string,
  action: PasteAction,
  at: number = Date.now(),
): HistoryEntry {
  const detectors: Record<string, number> = {};
  for (const finding of result.findings) {
    detectors[finding.detectorId] = (detectors[finding.detectorId] ?? 0) + 1;
  }

  return { at, site, level: result.risk.level, score: result.risk.score, detectors, action };
}

/** Newest first. Entries that do not parse are dropped rather than failing the read. */
export async function readHistory(area: StorageArea): Promise<HistoryEntry[]> {
  const raw = await area.get(KEY);
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    const parsed = entrySchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

export async function recordPaste(area: StorageArea, entry: HistoryEntry): Promise<void> {
  const existing = await readHistory(area);
  await area.set(KEY, [entry, ...existing].slice(0, HISTORY_LIMIT));
}

export async function clearHistory(area: StorageArea): Promise<void> {
  await area.remove(KEY);
}

export interface HistorySummary {
  readonly held: number;
  readonly sentRedacted: number;
  readonly sentOriginal: number;
  readonly cancelled: number;
}

export function summarise(entries: readonly HistoryEntry[], since: number): HistorySummary {
  const recent = entries.filter((e) => e.at >= since);
  return {
    held: recent.length,
    sentRedacted: recent.filter((e) => e.action === 'redacted').length,
    sentOriginal: recent.filter((e) => e.action === 'original').length,
    cancelled: recent.filter((e) => e.action === 'cancelled').length,
  };
}
