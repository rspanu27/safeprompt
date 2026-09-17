import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],

  manifest: {
    name: 'SafePrompt',
    description: 'Catch secrets and PII before you paste them into an AI assistant.',

    // Enumerated rather than <all_urls>. The extension has no reason to see any
    // other site, and a narrow list is far easier to justify in review.
    host_permissions: [
      'https://chatgpt.com/*',
      'https://chat.openai.com/*',
      'https://claude.ai/*',
      'https://gemini.google.com/*',
    ],

    // Settings only. Scanned content never reaches storage.
    permissions: ['storage'],
  },
});
