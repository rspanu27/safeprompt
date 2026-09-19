/**
 * Run adapter code so that an error can't break a paste.
 *
 * The adapters work with editors we don't control, and they will break at some
 * point: a site rewrites its editor, a selector changes, or an element is
 * missing. When that happens the user's paste should go through as normal
 * instead of being lost to an exception.
 *
 * So any error in adapter code returns the fallback value, and the fallback is
 * always the one that lets the paste continue.
 */
export function failOpen<T>(fallback: T, fn: () => T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}
