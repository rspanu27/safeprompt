import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
// Imported rather than relying on WXT's auto-import, so the file typechecks
// without depending on generated declarations.
import { defineContentScript } from 'wxt/utils/define-content-script';
import { createModalHost } from '../content/host';
import { completePaste, installInterceptor, type PasteDecision } from '../content/interceptor';
import { WarningModal } from '../ui/modal/WarningModal';

export default defineContentScript({
  matches: [
    'https://chatgpt.com/*',
    'https://chat.openai.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
  ],

  main() {
    installInterceptor({ onHold: showModal });
  },
});

function showModal(decision: PasteDecision): void {
  const host = createModalHost();
  const root = createRoot(host.container);

  const close = (): void => {
    root.unmount();
    host.remove();
  };

  const choose = (text: string) => (): void => {
    close();
    completePaste(decision, text);
  };

  root.render(
    createElement(WarningModal, {
      result: decision.result,
      onPasteRedacted: choose(decision.result.redacted),
      onPasteOriginal: choose(decision.original),
      onCancel: close,
    }),
  );
}
