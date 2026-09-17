import { targetFromEvent } from './generic';
import type { PasteTarget, SiteAdapter } from './types';

const HOSTS = new Set(['gemini.google.com']);

/** Quill, inside an Angular component. */
const COMPOSER = 'rich-textarea .ql-editor, div.ql-editor[contenteditable="true"]';

export const geminiAdapter: SiteAdapter = {
  id: 'gemini',
  matches: (url) => HOSTS.has(url.hostname),

  resolveTarget(event): PasteTarget | null {
    const target = targetFromEvent(event);
    if (target === null) return null;

    return target.element.closest(COMPOSER) === null ? null : target;
  },
};
