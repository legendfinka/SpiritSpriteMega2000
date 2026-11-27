import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { PUBLIC_FILES, serviceWorkerSource } from './src/pwa/serviceWorkerSource';

/** writes dist/sw.js with the list of built files, so the app works offline */
function offline(): Plugin {
  return {
    name: 'offline-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle).filter((file) => file !== 'index.html');
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        // a new version each build, so old caches get replaced
        source: serviceWorkerSource([...built, ...PUBLIC_FILES], Date.now().toString(36)),
      });
    },
  };
}

export default defineConfig({
  // relative paths, so it works from any host or subfolder
  base: './',
  plugins: [react(), offline()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
