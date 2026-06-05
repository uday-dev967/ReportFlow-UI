import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/scss/mandatoryimports.scss" as *;`,
        api: 'modern-compiler',
      },
    },
  },
  server: {
    host: true,
    proxy: {
      '/socket.io': {
        target: 'http://127.0.0.1:5051',
        ws: true,
        changeOrigin: true,
      },
      '/Automation': {
        target: 'http://127.0.0.1:5051',
        changeOrigin: true,
        timeout: 300_000,
        proxyTimeout: 300_000,
      },
    },
  },
  base: './',
});
