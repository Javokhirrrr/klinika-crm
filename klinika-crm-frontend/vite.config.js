import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react({
      // React Fast Refresh — faqat o'zgargan komponentni qayta render qiladi
      fastRefresh: true,
    }),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // ─── Build optimization ────────────────────────────────────────────────────
  build: {
    target: 'esnext',
    minify: 'esbuild',     // terser dan 2x tez
    cssMinify: true,
    sourcemap: false,       // production'da kerak emas
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Manual chunks — katta kutubxonalarni ajratish
        manualChunks: {
          // React core
          'react-core': ['react', 'react-dom', 'react-router-dom'],

          // UI library
          'ui-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-avatar',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
          ],

          // Charts — faqat kerak bo'lganda yuklanadi
          'charts': ['recharts'],

          // Icons
          'icons': ['lucide-react'],

          // State management
          'state': ['zustand'],
        },
      },
    },
  },

  // ─── Dev server ────────────────────────────────────────────────────────────
  server: {
    port: 5173,
    // HMR — Hot Module Replacement tezroq
    hmr: {
      overlay: true,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },

  // ─── Dependency pre-bundling ───────────────────────────────────────────────
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'zustand',
      'recharts',
      'lucide-react',
    ],
    // Exclude large rarely-used packages from eager pre-bundle
    exclude: [],
  },

  // ─── Test ─────────────────────────────────────────────────────────────────
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
});
