import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    root: '.',
    server: {
      port: 3000,
      host: '0.0.0.0',
      open: true,
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['lucide-react'],
            'export-vendor': ['html-to-image', 'jszip', 'file-saver'],
          },
        },
      },
    },
  };
});
