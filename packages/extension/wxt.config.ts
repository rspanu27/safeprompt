import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  zip: { artifactTemplate: 'safeprompt-{{version}}-{{browser}}.zip' },

  manifest: {
    // The store shows `name` as the listing's title and `description` under it,
    // and neither can be edited there. `short_name` is used where space is tight.
    name: 'SafePrompt: Paste Protection for AI Chats',
    short_name: 'SafePrompt',
    description:
      'Checks what you paste into ChatGPT, Claude and Gemini for secrets and personal data, and offers a redacted version.',

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
