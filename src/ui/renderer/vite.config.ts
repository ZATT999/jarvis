import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, 'src/ui/renderer'),
  build: {
    outDir: resolve(__dirname, 'dist/renderer'),
    rollupOptions: {
      input: { index: resolve(__dirname, 'src/ui/renderer/index.html') }
    }
  }
})
