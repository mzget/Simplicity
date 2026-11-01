import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import path from 'path';
import fs from 'fs';

/**
 * In Vite dev mode, @originjs/vite-plugin-federation does not serve dynamic assets
 * like remoteEntry.js in memory. This middleware serves the built federation chunks
 * from `dist/assets` during `npm run dev` with proper CORS and MIME headers.
 */
function serveFederationAssetsInDev(): Plugin {
  return {
    name: 'serve-federation-assets-in-dev',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url ? req.url.split('?')[0] : '';
        if (rawUrl.startsWith('/assets/')) {
          const filePath = path.resolve(__dirname, 'dist', rawUrl.slice(1));
          if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath);
            const mimeTypes: Record<string, string> = {
              '.js': 'application/javascript',
              '.css': 'text/css',
              '.json': 'application/json',
              '.svg': 'image/svg+xml',
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', '*');
            if (req.method === 'OPTIONS') {
              res.statusCode = 204;
              return res.end();
            }
            return fs.createReadStream(filePath).pipe(res);
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    serveFederationAssetsInDev(),
    react(),
    federation({
      name: 'simplicity_finance',
      filename: 'remoteEntry.js',
      exposes: {
        './FinanceApp': './src/FederatedFinanceApp.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^19.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
        zustand: { singleton: true },
      } as any,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    modulePreload: false,
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    cors: true,
  },
});
