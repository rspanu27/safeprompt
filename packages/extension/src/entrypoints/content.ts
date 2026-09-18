import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
// Imported rather than relying on WXT's auto-import, so the file typechecks
// without depending on generated declarations.
import { defineContentScript } from 'wxt/utils/define-content-script';
import { createModalHost } from '../content/host';
import {
  cancelPaste,
  completePaste,
  installInterceptor,
  type PasteDecision,
} from '../content/interceptor';
import { WarningModal } from '../ui/modal/WarningModal';

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
    installInterceptor({ onHold: showModal });
  },
});

function showModal(decision: PasteDecision): void {
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

  const choose = (text: string) => (): void => {
    if (close()) completePaste(decision, text);
  };

  const cancel = (): void => {
    if (close()) cancelPaste(decision);
  };

  root.render(
    createElement(WarningModal, {
      result: decision.result,
      onPasteRedacted: choose(decision.result.redacted),
      onPasteOriginal: choose(decision.original),
      onCancel: cancel,
    }),
  );
}
