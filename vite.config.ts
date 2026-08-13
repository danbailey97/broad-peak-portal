import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  root: path.resolve(root, 'client'),
  resolve: {
    alias: {
      '@': path.resolve(root, 'client/src'),
    },
  },
  build: {
    outDir: path.resolve(root, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5001',
      '/uploads': 'http://localhost:5001',
    },
  },
});
