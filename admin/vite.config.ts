import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The panel reuses the site's design tokens, fonts and wordmarks by relative path, so Vite has to
// read outside `admin/` (dev: server.fs.allow; Vercel: "Include source files outside of the Root
// Directory"). publicDir is the site's, which serves /fonts/* and /wordmark-*.svg unchanged.
export default defineConfig({
  plugins: [react()],
  publicDir: '../public',
  // ../src/lib imports zod and yaml: resolve them from admin/node_modules, not the repo root's.
  resolve: { dedupe: ['zod', 'yaml'] },
  server: { fs: { allow: ['..'] } },
});
