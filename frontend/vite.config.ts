import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  publicDir: '../public',
  server: {
    port: 5173
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  resolve: {
    extensions: ['.ts', '.js']
  }
}); 