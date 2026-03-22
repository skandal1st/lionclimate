import path from 'path';
import fs from 'fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const imgRoot = path.resolve(__dirname, '../img');

function serveParentImg(): Plugin {
  return {
    name: 'serve-parent-img',
    configureServer(server) {
      server.middlewares.use('/img', (req, res, next) => {
        const url = req.url?.split('?')[0] || '/';
        const rel = path.normalize(decodeURIComponent(url)).replace(/^(\.\.(\/|\\|$))+/, '');
        const filePath = path.join(imgRoot, rel);
        if (!filePath.startsWith(imgRoot)) {
          next();
          return;
        }
        fs.stat(filePath, (err, stat) => {
          if (err || !stat.isFile()) {
            next();
            return;
          }
          const ext = path.extname(filePath).toLowerCase();
          const mime: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
          };
          res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
          fs.createReadStream(filePath).pipe(res);
        });
      });
    },
  };
}

export default defineConfig({
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [
    react(),
    serveParentImg(),
    viteStaticCopy({
      targets: [{ src: '../img/**/*', dest: 'img' }],
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true },
    },
  },
  // `npm run preview` без этого отдаёт index.html на /api/* → та же ошибка парсинга JSON
  preview: {
    port: 4173,
    proxy: {
      '/api': { target: 'http://127.0.0.1:3001', changeOrigin: true },
    },
  },
});
