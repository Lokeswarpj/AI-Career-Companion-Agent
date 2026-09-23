import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function syncDistPlugin() {
  return {
    name: 'sync-dist-plugin',
    closeBundle() {
      const rootDist = path.resolve(__dirname, '../dist');
      const frontendDist = path.resolve(__dirname, 'dist');
      try {
        if (fs.existsSync(rootDist)) {
          fs.cpSync(rootDist, frontendDist, { recursive: true });
        }
        if (fs.existsSync(frontendDist) && !fs.existsSync(rootDist)) {
          fs.cpSync(frontendDist, rootDist, { recursive: true });
        }
      } catch (err) {
        console.warn('Dist sync notice:', err.message);
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), syncDistPlugin()],
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
