import type { PasteTarget, SiteAdapter } from './types';

/** The element the paste is actually landing in. */
export function targetFromEvent(event: ClipboardEvent): PasteTarget | null {
  const node = event.target;
  if (!(node instanceof HTMLElement)) return null;

  if (node instanceof HTMLTextAreaElement || node instanceof HTMLInputElement) {
    return node.readOnly || node.disabled ? null : { kind: 'value', element: node };
  }

  // The event target may be a text node's parent deep inside the editor, so
  // walk up to whatever actually declares itself editable.
  const editable = node.closest<HTMLElement>('[contenteditable="true"], [contenteditable=""]');
  return editable === null ? null : { kind: 'contenteditable', element: editable };
}

/**
 * Fallback for sites without a dedicated adapter.
 *
 * Only reached if one is registered for the current origin, so this is about
 * unfamiliar editors on a known site rather than the open web.
 */
export const genericAdapter: SiteAdapter = {
  id: 'generic',
  matches: () => true,
  resolveTarget: targetFromEvent,
};
