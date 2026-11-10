import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          tensorflow: ['@tensorflow/tfjs'],
          leaflet: ['leaflet'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
        },
      },
    },
    chunkSizeWarningLimit: 1600,
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['@tensorflow/tfjs'],
  },
});
