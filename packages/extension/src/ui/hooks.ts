import { useCallback, useEffect, useState } from 'react';
import { readHistory, type HistoryEntry } from '../history/history';
import type { Settings } from '../settings/schema';
import { loadSettings, saveSettings, watchSettings } from '../settings/store';
import type { StorageArea } from '../storage/area';

/**
 * Settings kept in step with storage.
 *
 * Changes from other pages — the popup while the options page is open, say —
 * arrive through the storage listener, so both stay consistent without talking
 * to each other.
 */
export function useSettings(area: StorageArea): {
  settings: Settings | null;
  update: (patch: Partial<Settings>) => void;
} {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    let live = true;
    loadSettings(area).then(
      (loaded) => {
        if (live) setSettings(loaded);
      },
      () => undefined,
    );
    const stop = watchSettings(area, setSettings);

    return () => {
      live = false;
      stop();
    };
  }, [area]);

  const update = useCallback(
    (patch: Partial<Settings>) => {
      if (settings === null) return;
      const next = { ...settings, ...patch };
      setSettings(next);
      saveSettings(area, next).catch(() => undefined);
    },
    [area, settings],
  );

  return { settings, update };
}

export function useHistory(area: StorageArea): HistoryEntry[] | null {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);

  useEffect(() => {
    let live = true;
    const refresh = (): void => {
      readHistory(area).then(
        (read) => {
          if (live) setEntries(read);
        },
        () => undefined,
      );
    };

    refresh();
    const stop = area.onChanged('history', refresh);

    return () => {
      live = false;
      stop();
    };
  }, [area]);

  return entries;
}
