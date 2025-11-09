import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'pkg/',
        'pkg-node/',
        'pkg-bundler/',
        'tests/',
        'examples/',
        '*.config.*'
      ]
    },
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    testTimeout: 10000
  },
  resolve: {
    alias: {
      'pdf-thumbnail-wasm': resolve(__dirname, './pkg')
    }
  }
});
