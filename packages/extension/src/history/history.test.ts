import { scanText } from '@safeprompt/core';
import { describe, expect, it } from 'vitest';
import { memoryArea } from '../storage/area';
import {
  HISTORY_LIMIT,
  clearHistory,
  historyEntry,
  readHistory,
  recordPaste,
  summarise,
} from './history';

const PASTE = 'DATABASE_URL=postgres://svc:Hq7Kd0Lm2Pn9@db-prod-01.internal:5432/orders';

describe('historyEntry', () => {
  it('records nothing that was pasted', () => {
    // The entry is going into storage. Any fragment of the paste in it would
    // make history a second copy of the secret.
    const serialised = JSON.stringify(historyEntry(scanText(PASTE), 'claude', 'redacted'));

    for (const fragment of ['Hq7Kd0Lm2Pn9', 'db-prod-01', 'svc', 'orders', 'postgres://']) {
      expect(serialised).not.toContain(fragment);
    }
  });

  it('counts findings per detector', () => {
    const entry = historyEntry(scanText(PASTE), 'claude', 'redacted');
    expect(entry.detectors['database-url']).toBeGreaterThan(1);
  });

  it('keeps the level, score, site and choice', () => {
    const entry = historyEntry(scanText(PASTE), 'gemini', 'original', 1000);

    expect(entry).toMatchObject({
      at: 1000,
      site: 'gemini',
      level: 'critical',
      action: 'original',
    });
  });
});

describe('history storage', () => {
  it('stores newest first', async () => {
    const area = memoryArea();
    const result = scanText(PASTE);

    await recordPaste(area, historyEntry(result, 'claude', 'redacted', 1));
    await recordPaste(area, historyEntry(result, 'claude', 'cancelled', 2));

    expect((await readHistory(area)).map((e) => e.at)).toEqual([2, 1]);
  });

  it(`keeps at most ${HISTORY_LIMIT} entries`, async () => {
    const area = memoryArea();
    const result = scanText(PASTE);

    for (let i = 0; i < HISTORY_LIMIT + 5; i += 1) {
      await recordPaste(area, historyEntry(result, 'claude', 'redacted', i));
    }

    const history = await readHistory(area);
    expect(history).toHaveLength(HISTORY_LIMIT);
    expect(history[0]?.at).toBe(HISTORY_LIMIT + 4);
  });

  it('drops malformed entries instead of failing', async () => {
    const good = historyEntry(scanText(PASTE), 'claude', 'redacted', 5);
    const area = memoryArea({ history: [good, { at: 'yesterday' }, null] });

    expect(await readHistory(area)).toEqual([good]);
  });

  it('reads garbage as empty', async () => {
    expect(await readHistory(memoryArea({ history: 'corrupted' }))).toEqual([]);
  });

  it('clears', async () => {
    const area = memoryArea();
    await recordPaste(area, historyEntry(scanText(PASTE), 'claude', 'redacted'));
    await clearHistory(area);

    expect(await readHistory(area)).toEqual([]);
  });
});

describe('summarise', () => {
  it('counts only entries since the given time, by outcome', () => {
    const result = scanText(PASTE);
    const entries = [
      historyEntry(result, 'claude', 'redacted', 300),
      historyEntry(result, 'claude', 'original', 200),
      historyEntry(result, 'claude', 'cancelled', 150),
      historyEntry(result, 'claude', 'redacted', 50),
    ];

    expect(summarise(entries, 100)).toEqual({
      held: 3,
      sentRedacted: 1,
      sentOriginal: 1,
      cancelled: 1,
    });
  });
});
