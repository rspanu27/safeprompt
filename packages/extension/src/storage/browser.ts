import { browser } from 'wxt/browser';
import type { StorageArea } from './area';

function wrap(name: 'sync' | 'local'): StorageArea {
  const area = browser.storage[name];

  return {
    async get(key) {
      const stored = await area.get(key);
      return stored[key];
    },

    set: (key, value) => area.set({ [key]: value }),
    remove: (key) => area.remove(key),

    onChanged(key, listener) {
      const handler = (changes: Record<string, { newValue?: unknown }>, areaName: string): void => {
        if (areaName !== name) return;
        const change = changes[key];
        if (change !== undefined) listener(change.newValue);
      };

      browser.storage.onChanged.addListener(handler);
      return () => {
        browser.storage.onChanged.removeListener(handler);
      };
    },
  };
}

/** Follows the user between machines. Settings live here. */
export const syncArea: StorageArea = wrap('sync');

/**
 * This device only. History lives here: sync has tight quotas, and a record of
 * what was pasted where has no business leaving the machine it happened on.
 */
export const localArea: StorageArea = wrap('local');
