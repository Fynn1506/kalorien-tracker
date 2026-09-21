import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// Set to e.g. "/kalorien-tracker/" when building for GitHub Pages (a project
// page is served from a subpath); local dev and single-host deploys stay "/".
const base = process.env.VITE_BASE_PATH || '/'
const withBase = (path: string) => `${base}${path.replace(/^\//, '')}`

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-32.png', 'icons/icon-180.png'],
      manifest: {
        name: 'Kalorien Tracker',
        short_name: 'Kalorien',
        description: 'Ernährung und Kalorien einfach tracken',
        lang: 'de',
        theme_color: '#34C759',
        background_color: '#FAFAFA',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: withBase('icons/icon-192.png'), sizes: '192x192', type: 'image/png' },
          { src: withBase('icons/icon-512.png'), sizes: '512x512', type: 'image/png' },
          {
            src: withBase('icons/icon-maskable-192.png'),
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: withBase('icons/icon-maskable-512.png'),
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // App-shell caching so the UI still loads offline; API calls fall back
        // to the network and simply fail gracefully when offline (handled in
        // the UI), since diary data must stay fresh, not cached long-term.
        globPatterns: ['**/*.{js,css,html,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'off-api-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
