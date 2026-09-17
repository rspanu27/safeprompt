import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The UI is a DOM component in a shadow root; there is nothing to test here
    // without a document.
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
