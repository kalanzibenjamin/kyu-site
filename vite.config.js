import { defineConfig } from 'vite'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'pages/about/index.html'),
        announcements: resolve(__dirname, 'pages/announcements/index.html'),
        faq: resolve(__dirname, 'pages/faq/index.html'),
        contact: resolve(__dirname, 'pages/contact/index.html'),
        resources: resolve(__dirname, 'pages/resources/index.html'),
        programs: resolve(__dirname, 'pages/programs/index.html'),
        contribute: resolve(__dirname, 'pages/contribute/index.html'),
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
  publicDir: 'src',
  server: {
    open: true,
    port: 3000
  }
})
