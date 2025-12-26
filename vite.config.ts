import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';

function getBaseUrl() {
  const { homepage } = JSON.parse(readFileSync('package.json', 'utf-8')) as {
    homepage?: string;
  };
  if (!homepage) return '/';

  // If it's a full URL, extract just the pathname
  if (homepage.startsWith('http')) {
    const url = new URL(homepage);
    return url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '') + '/';
  }

  const base = homepage.startsWith('/') ? homepage : `/${homepage}`;
  return base.replace(/\/$/, '') + '/';
}

export default defineConfig({
  base: getBaseUrl(),
  plugins: [
    react(),
    svgr({
      include: '**/*.svg',
      svgrOptions: { exportType: 'named', namedExport: 'ReactComponent' },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'build',
  },
});
