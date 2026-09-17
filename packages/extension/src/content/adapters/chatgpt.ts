import { targetFromEvent } from './generic';
import type { PasteTarget, SiteAdapter } from './types';

const HOSTS = new Set(['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com']);

/** ProseMirror. `#prompt-textarea` is the composer despite the name. */
const COMPOSER = '#prompt-textarea, div.ProseMirror[contenteditable="true"]';

export const chatgptAdapter: SiteAdapter = {
  id: 'chatgpt',
  matches: (url) => HOSTS.has(url.hostname),

  resolveTarget(event): PasteTarget | null {
    const target = targetFromEvent(event);
    if (target === null) return null;

    // Only the message composer. A paste into a search box or a custom
    // instructions field is not what this is for.
    return target.element.closest(COMPOSER) === null ? null : target;
  },
};
