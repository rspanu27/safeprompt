import { resolveAdapter } from './adapters';

/** What the popup sends to a tab's content script to ask what it can see. */
export const STATUS_REQUEST = 'safeprompt:page-status';

export type PageStatus = 'watching' | 'no-composer';

export function isStatusRequest(message: unknown): boolean {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as { type?: unknown }).type === STATUS_REQUEST
  );
}

export function isPageStatus(value: unknown): value is PageStatus {
  return value === 'watching' || value === 'no-composer';
}

/**
 * Whether this page has a message box the site's adapter recognises.
 *
 * A page that is still loading counts as fine: these sites draw their editor
 * late, and reporting it missing before then would be a false alarm.
 */
export function pageStatus(
  doc: Document = document,
  url: URL = new URL(doc.location.href),
): PageStatus {
  if (doc.readyState !== 'complete') return 'watching';
  return resolveAdapter(url).hasComposer(doc) ? 'watching' : 'no-composer';
}
