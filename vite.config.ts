import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: 'examples',
  publicDir: '../public',

  server: {
    port: 5173,
    fs: {
      // Allow serving files from parent directory
      allow: ['..']
    },
    headers: {
      // Required for SharedArrayBuffer support
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },

  resolve: {
    alias: {
      'pdf-thumbnail-wasm': resolve(__dirname, './pkg')
    }
  },

  optimizeDeps: {
    exclude: ['pdf-thumbnail-wasm']
  },

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'examples/index.html')
      }
    }
  }
});
