import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/auth': 'http://localhost:3000',
        '/usuarios': 'http://localhost:3000',
        '/pymes': 'http://localhost:3000',
        '/health': 'http://localhost:3000',
      },
    },
  },
})
