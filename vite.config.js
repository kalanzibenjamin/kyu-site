import { defineConfig } from 'vite'
import { globSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { copyFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Helper to recursively copy directories
function copyDirSync(src, dest) {
  mkdirSync(dest, { recursive: true })
  const files = readdirSync(src)
  files.forEach(file => {
    const srcFile = resolve(src, file)
    const destFile = resolve(dest, file)
    if (statSync(srcFile).isDirectory()) {
      copyDirSync(srcFile, destFile)
    } else {
      copyFileSync(srcFile, destFile)
    }
  })
}
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
      },
      output: {
        // Hook after bundle to copy data folder
      }
    },
    copyPublicDir: true
  },
  plugins: [
    {
      name: 'copy-data',
      closeBundle() {
        // Copy data folder to dist after build
        try {
          copyDirSync(
            resolve(__dirname, 'data'),
            resolve(__dirname, 'dist/data')
          )
          console.log('✓ Copied data/ to dist/data')
        } catch (err) {
          console.error('Error copying data folder:', err.message)
        }
      }
    }
  ],

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
