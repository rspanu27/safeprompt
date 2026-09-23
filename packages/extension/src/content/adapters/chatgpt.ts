import { targetFromEvent } from './generic';
import type { PasteTarget, SiteAdapter } from './types';

const HOSTS = new Set(['chatgpt.com', 'www.chatgpt.com', 'chat.openai.com']);

/**
 * Signed in, the composer is ProseMirror (`#prompt-textarea`, despite the
 * name). Signed out, ChatGPT serves a different build with a plain textarea.
 */
const COMPOSER = [
  '#prompt-textarea',
  'div.ProseMirror[contenteditable="true"]',
  'textarea[name="prompt"]',
].join(', ');

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
