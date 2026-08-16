import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/version-3/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../version-3',
    emptyOutDir: true,
  },
})
