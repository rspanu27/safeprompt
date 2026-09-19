import { browser } from 'wxt/browser';
import type { StorageArea } from './area';

/**
 * `chrome.storage.local`, holding both settings and history.
 *
 * Deliberately not `sync`: the allowlist can contain values the user considers
 * sensitive, and sync would copy them through their Google account to every
 * signed-in device. Nothing SafePrompt keeps leaves the machine.
 */
export const localArea: StorageArea = {
  async get(key) {
    const stored = await browser.storage.local.get(key);
    return stored[key];
  },

  set: (key, value) => browser.storage.local.set({ [key]: value }),
  remove: (key) => browser.storage.local.remove(key),

  onChanged(key, listener) {
    const handler = (changes: Record<string, { newValue?: unknown }>, areaName: string): void => {
      if (areaName !== 'local') return;
      const change = changes[key];
      if (change !== undefined) listener(change.newValue);
    };

    browser.storage.onChanged.addListener(handler);
    return () => {
      browser.storage.onChanged.removeListener(handler);
    };
  },
};
