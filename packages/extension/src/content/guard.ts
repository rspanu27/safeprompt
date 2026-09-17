/**
 * Run adapter code so that failure can never corrupt a paste.
 *
 * Site adapters reach into editors we do not control and cannot test against
 * every version of. They will break — an editor ships a rewrite, a selector
 * changes, an element is null when it never was before. The requirement is that
 * when that happens the user's paste goes through untouched and they never find
 * out, rather than losing their clipboard to an exception.
 *
 * So every call into adapter code returns a fallback on throw, and the fallback
 * is always the option that lets the paste proceed.
 */
export function failOpen<T>(fallback: T, fn: () => T): T {
  try {
    return fn();
  } catch {
    return fallback;
  }
}
