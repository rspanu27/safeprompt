import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * Renders the modal, popup and options page in an ordinary tab, with in-memory
 * storage, so they can be styled without reloading the extension.
 */
export default defineConfig({
  root: 'src/preview',
  plugins: [react()],
  server: { port: 5174, strictPort: true },
});
