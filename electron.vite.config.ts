import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@core': resolve(__dirname, 'src/core'),
        '@voice': resolve(__dirname, 'src/voice'),
        '@llm': resolve(__dirname, 'src/llm'),
        '@plugins': resolve(__dirname, 'src/plugins'),
        '@system': resolve(__dirname, 'src/system'),
        '@integrations': resolve(__dirname, 'src/integrations'),
      }
    },
    build: {
      outDir: resolve(__dirname, 'dist/main'),
      lib: {
        entry: {
          main: resolve(__dirname, 'src/ui/main.ts'),
          cli: resolve(__dirname, 'src/cli.ts'),
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: resolve(__dirname, 'dist/preload'),
      lib: {
        entry: resolve(__dirname, 'src/ui/preload.ts')
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/ui/renderer'),
    build: {
      outDir: resolve(__dirname, 'dist/renderer'),
      rollupOptions: {
        input: resolve(__dirname, 'src/ui/renderer/index.html')
      }
    }
  }
})
