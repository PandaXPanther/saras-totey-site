import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  base: '/',
  plugins: [react()],
  optimizeDeps: { include: ['three', '@react-three/fiber'] },
  server: { port: 5173, host: '0.0.0.0' },
  build: { outDir: 'dist', assetsInlineLimit: 4096 }
})
