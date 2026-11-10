import process from 'node:process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  server: {
    proxy: {
      "/api": `http://127.0.0.1:${process.env.PORT || 5000}`,
    },
  },
}))
