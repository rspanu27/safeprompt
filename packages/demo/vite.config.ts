import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // A relative base so the build works from any path, including the
  // /safeprompt/ subdirectory that GitHub Pages serves this project from.
  base: './',
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
