import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/pdf-thumbnail-wasm/' : '/',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      'pdf-thumbnail-wasm': path.resolve(__dirname, '../pkg')
    }
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
})
