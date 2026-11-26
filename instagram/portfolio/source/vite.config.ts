import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// A path from a URL relative to this file (the site doesn't install Node's types, so no node:url).
const path = (relative: string) => decodeURIComponent(new URL(relative, import.meta.url).pathname);

// Serves the carousel's slides for render.mjs to capture. The phones are the website's own screen components and
// styles, imported straight from src/, so the slides match the site (and the app) without a copy to keep in step.
export default defineConfig({
  root: path('.'),
  plugins: [react(), tailwindcss()],
  server: {
    port: 5199,
    strictPort: true,
    fs: { allow: [path('../../../')] },
  },
  logLevel: 'warn',
});
