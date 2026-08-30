import { defineConfig } from 'vite'
import { globSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const pageEntries = Object.fromEntries(
  globSync('pages/**/index.html').map((file) => {
    const entryName = file.replace(/\\/g, '/').replace(/^pages\//, '').replace(/\/index\.html$/, '')
    return [entryName, resolve(__dirname, file)]
  })
)

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ...pageEntries,
        '404': resolve(__dirname, '404.html')
      }
    },
    copyPublicDir: true
  },

  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['import', 'legacy-js-api', 'global-builtin', 'color-functions', 'strict-unary']
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@data': resolve(__dirname, 'data'),
      '@partials': resolve(__dirname, 'partials')
    }
  },
  publicDir: 'src/assets',
  server: {
    open: true,
    port: 3000
  }
})
