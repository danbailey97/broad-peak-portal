import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  // Root is the repo root — node_modules resolves correctly here
  // We point Rollup at client/index.html as the entry
  root: root,
  resolve: {
    alias: {
      '@': path.resolve(root, 'client/src'),
    },
  },
  build: {
    outDir: path.resolve(root, 'dist/public'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(root, 'client/index.html'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5001',
      '/uploads': 'http://localhost:5001',
    },
  },
});
