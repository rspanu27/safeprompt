import type { StorageArea } from '../storage/area';
import { DEFAULT_SETTINGS, parseSettings, type Settings } from './schema';

const KEY = 'settings';

export async function loadSettings(area: StorageArea): Promise<Settings> {
  return parseSettings(await area.get(KEY));
}

export async function saveSettings(area: StorageArea, settings: Settings): Promise<void> {
  await area.set(KEY, parseSettings(settings));
}

export function watchSettings(area: StorageArea, listener: (s: Settings) => void): () => void {
  return area.onChanged(KEY, (raw) => {
    listener(parseSettings(raw));
  });
}

export interface SettingsCache {
  current(): Settings;
  readonly ready: Promise<void>;
  dispose(): void;
}

/**
 * Settings the content script can read synchronously.
 *
 * A paste has to be cancelled during the event, so there is no time to await
 * storage. The cache starts from the defaults — protection on — and is replaced
 * as soon as storage answers. If storage never answers, the defaults stand.
 */
export function createSettingsCache(area: StorageArea): SettingsCache {
  let settings: Settings = DEFAULT_SETTINGS;
  let changedWhileLoading = false;

  const stop = watchSettings(area, (next) => {
    settings = next;
    changedWhileLoading = true;
  });

  const ready = loadSettings(area).then(
    (loaded) => {
      // A change that landed first is newer than what the load read.
      if (!changedWhileLoading) settings = loaded;
    },
    () => undefined,
  );

  return { current: () => settings, ready, dispose: stop };
}
