import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
// Imported rather than relying on WXT's auto-import, so the file typechecks
// without depending on generated declarations.
import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';
import { createModalHost, createNoticeHost } from '../content/host';
import {
  cancelPaste,
  completePaste,
  installInterceptor,
  type PasteDecision,
} from '../content/interceptor';
import { isStatusRequest, pageStatus } from '../content/status';
import { historyEntry, recordPaste, type PasteAction } from '../history/history';
import { policyFor } from '../settings/policy';
import { createSettingsCache, type SettingsCache } from '../settings/store';
import { localArea } from '../storage/browser';
import { WarningModal } from '../ui/modal/WarningModal';
import { UnwatchedNotice } from '../ui/notice/UnwatchedNotice';

const INSERT_FAILED =
  'The editor did not accept the text, so nothing was pasted. You can copy the redacted version above by hand.';

/** Long enough to read, short enough not to linger on a page it doesn't apply to. */
const NOTICE_MS = 20_000;

export default defineContentScript({
  matches: [
    'https://chatgpt.com/*',
    'https://chat.openai.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
  ],

  // Before any page script runs, so the paste listener is registered ahead of
  // anything the page adds to window itself.
  runAt: 'document_start',

  main() {
    const settings = createSettingsCache(localArea);

    installInterceptor({
      policy: (site) => policyFor(settings.current(), site),
      onHold: (decision) => {
        showModal(decision, settings);
      },
      onUnwatched: showNotice,
    });

    // The popup asks what this page looks like, so it can say when pastes
    // here are not being checked instead of claiming to watch them.
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (isStatusRequest(message)) sendResponse(pageStatus());
    });
  },
});

let noticeShown = false;

/**
 * Say that a paste went through unchecked.
 *
 * Once per page. These sites rarely reload, so that is about once per tab,
 * which is enough to be noticed without nagging on a page that has no message
 * box for a good reason, like a settings page.
 */
function showNotice(site: string): void {
  if (noticeShown) return;
  noticeShown = true;

  const host = createNoticeHost();
  const root = createRoot(host.container);
  let open = true;

  const close = (): void => {
    if (!open) return;
    open = false;
    clearTimeout(timer);
    root.unmount();
    host.remove();
  };

  const timer = setTimeout(close, NOTICE_MS);
  root.render(createElement(UnwatchedNotice, { site, onDismiss: close }));
}

function record(decision: PasteDecision, action: PasteAction, settings: SettingsCache): void {
  if (!settings.current().history) return;

  // Best effort. A full or unavailable storage area must not surface as an
  // error in the middle of the user's paste.
  recordPaste(localArea, historyEntry(decision.result, decision.site, action)).catch(
    () => undefined,
  );
}

function showModal(decision: PasteDecision, settings: SettingsCache): void {
  const host = createModalHost();
  const root = createRoot(host.container);
  let open = true;

  const close = (): boolean => {
    if (!open) return false;
    open = false;
    root.unmount();
    host.remove();
    return true;
  };

  const choose = (text: string, action: PasteAction) => (): void => {
    if (!open) return;

    // Insert before closing: if the editor refuses, the modal stays up with the
    // redacted text visible rather than vanishing with nothing pasted.
    if (!completePaste(decision, text)) {
      render(INSERT_FAILED);
      return;
    }

    close();
    record(decision, action, settings);
  };

  const cancel = (): void => {
    if (!close()) return;
    cancelPaste(decision);
    record(decision, 'cancelled', settings);
  };

  function render(notice?: string): void {
    root.render(
      createElement(WarningModal, {
        result: decision.result,
        onPasteRedacted: choose(decision.result.redacted, 'redacted'),
        onPasteOriginal: choose(decision.original, 'original'),
        onCancel: cancel,
        ...(notice === undefined ? {} : { notice }),
      }),
    );
  }

  render();
}
