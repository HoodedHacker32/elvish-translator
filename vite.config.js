import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // relative paths, so the built site works at any address (e.g. username.github.io/repo-name/)
  base: './',
  server: { port: 5193 },
  build: { chunkSizeWarningLimit: 1200 }, // the lexicons are large on purpose
})
