import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

// Repository root. The design tokens live in frontend-migrate/design-export/
// and the example payloads in data/examples/, both outside this folder.
const repoRoot = fileURLToPath(new URL('..', import.meta.url));

/**
 * design-export/motion.css opens with a comment that contains a nested
 * "/* UNUSED *\/" marker, which closes the comment early and leaves stray
 * text that the CSS minifier rejects. The file is generated and kept
 * verbatim, so it is repaired here at load time instead: only the marker
 * inside that first comment changes, every keyframe stays as exported.
 */
function repairMotionHeader(): Plugin {
  const marker = 'carry /* UNUSED */.';
  return {
    name: 'repair-design-export-motion-header',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replace(/\\/g, '/').endsWith('/frontend-migrate/design-export/motion.css')) return null;
      if (!code.includes(marker)) return null;
      return { code: code.replace(marker, 'carry an UNUSED marker.'), map: null };
    },
  };
}

export default defineConfig({
  plugins: [repairMotionHeader(), react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    fs: { allow: [repoRoot] },
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  preview: {
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
