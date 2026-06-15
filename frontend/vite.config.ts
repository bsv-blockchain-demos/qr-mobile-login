import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['deggen.ngrok.app'],
    proxy: {
      '/api': process.env['API_URL'] ?? 'http://localhost:3000',
      '/ws': {
        target: process.env['WS_URL'] ?? 'ws://localhost:3000',
        ws: true,
      },
    },
  },
})
