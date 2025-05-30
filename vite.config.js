// vite.config.ts
import { defineConfig } from 'vite'
import react       from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    proxy: {
      // Proxy any /static/* requests in dev to your FastAPI backend:
      '/static': {
        target: 'https://ticketing-api-z0gp.onrender.com',
        changeOrigin: true,
        secure: false,        // if you’re using a self-signed cert
      },
    }
  }
})
