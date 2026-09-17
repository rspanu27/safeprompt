import { targetFromEvent } from './generic';
import type { PasteTarget, SiteAdapter } from './types';

const HOSTS = new Set(['claude.ai', 'www.claude.ai']);

/** ProseMirror, marked with a test id rather than a stable class. */
const COMPOSER = 'div[contenteditable="true"].ProseMirror, [data-testid="chat-input"]';

export const claudeAdapter: SiteAdapter = {
  id: 'claude',
  matches: (url) => HOSTS.has(url.hostname),

  resolveTarget(event): PasteTarget | null {
    const target = targetFromEvent(event);
    if (target === null) return null;

    return target.element.closest(COMPOSER) === null ? null : target;
  },
};
