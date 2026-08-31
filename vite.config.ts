import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const base = process.env.GITHUB_PAGES ? '/scriptor-algorithmus/' : '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw-share.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png', 'manifest.webmanifest'],
      devOptions: { enabled: false },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,ico,woff2}'],
      },
      manifest: false,
    }),
  ],
});
