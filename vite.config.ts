import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps every asset reference relative, so the build works from any sub-path
// (GitHub Pages project sites, a folder on a static host, ...).
export default defineConfig({
  plugins: [react()],
  base: './',
});
