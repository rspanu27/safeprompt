import { scanText } from '@safeprompt/core';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
// Imported rather than relying on WXT's auto-import, so the file typechecks
// without depending on generated declarations.
import { defineContentScript } from 'wxt/utils/define-content-script';
import { createModalHost } from '../content/host';
import { DEMO_PASTE } from '../content/demo';
import { WarningModal } from '../ui/modal/WarningModal';

export default defineContentScript({
  matches: [
    'https://chatgpt.com/*',
    'https://chat.openai.com/*',
    'https://claude.ai/*',
    'https://gemini.google.com/*',
  ],

  main() {
    // Paste interception arrives with the site adapters. Until then the modal
    // is opened by hand, so the UI can be exercised without an editor involved.
    window.addEventListener('keydown', (event) => {
      const wanted = event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'y';
      if (!wanted) return;

      event.preventDefault();
      showModal();
    });
  },
});

function showModal(): void {
  const host = createModalHost();
  const root = createRoot(host.container);

  const close = (): void => {
    root.unmount();
    host.remove();
  };

  root.render(
    createElement(WarningModal, {
      result: scanText(DEMO_PASTE),
      onPasteRedacted: close,
      onPasteOriginal: close,
      onCancel: close,
    }),
  );
}
