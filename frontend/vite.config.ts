import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxy API requests to backend Express server running on port 5001
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
