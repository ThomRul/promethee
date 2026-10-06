import { fileURLToPath, URL } from 'node:url';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  main: { plugins: [externalizeDepsPlugin()], build: { lib: { entry: 'electron/main/index.ts' } } },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: { entry: 'electron/preload/index.ts', formats: ['cjs'], fileName: () => 'index.cjs' },
    },
  },
  renderer: {
    root: '.',
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    build: { rollupOptions: { input: 'index.html' } },
  },
});
