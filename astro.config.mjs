import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/auth': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          bypass: (req) => {
            if (req.url && req.url.startsWith('/auth/google/callback')) {
              if (req.url.includes('exchange=1')) {
                return
              }
              return req.url
            }
          },
        },
        '/usuarios': 'http://localhost:3000',
        '/pymes': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          bypass: (req) => {
            if (req.url && req.url.startsWith('/pymes/new')) {
              return req.url
            }
          },
        },
        '/health': 'http://localhost:3000',
      },
    },
  },
})
