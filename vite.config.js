import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/careguide/',
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/careguide/api': {
        target: process.env.API_URL || 'http://127.0.0.1:4000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/careguide\/api/, ''),
      },
    },
  },
});
