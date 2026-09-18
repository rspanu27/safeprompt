/**
 * The slice of `chrome.storage` this extension uses.
 *
 * Everything above this line is written against the interface, so settings and
 * history are tested against an in-memory area rather than a mocked browser.
 */
export interface StorageArea {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
  /** Called when the key changes, in this context or any other. */
  onChanged(key: string, listener: (value: unknown) => void): () => void;
}

export function memoryArea(initial: Record<string, unknown> = {}): StorageArea {
  const data = new Map(Object.entries(initial));
  const listeners = new Map<string, Set<(value: unknown) => void>>();

  const notify = (key: string): void => {
    for (const listener of listeners.get(key) ?? []) listener(data.get(key));
  };

  return {
    get: (key) => Promise.resolve(data.get(key)),

    set(key, value) {
      // Round-trip through JSON, as real storage does, so a test cannot pass by
      // relying on an object identity or a type storage would not keep.
      data.set(key, JSON.parse(JSON.stringify(value)) as unknown);
      notify(key);
      return Promise.resolve();
    },

    remove(key) {
      data.delete(key);
      notify(key);
      return Promise.resolve();
    },

    onChanged(key, listener) {
      const set = listeners.get(key) ?? new Set();
      set.add(listener);
      listeners.set(key, set);
      return () => set.delete(listener);
    },
  };
}
