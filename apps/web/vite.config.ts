import tailwindcss from '@tailwindcss/vite'
import tanstackRouter from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

export default defineConfig({
  server: { port: 4016 },
  plugins: [
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react({ compiler: true }),
    visualizer({
      filename: './dist/stats.html',
      gzipSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.join(import.meta.dirname, './src'),
    },
  },
  build: {
    modulePreload: {
      polyfill: false,
    },
    rolldownOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-core'
          }
          if (id.includes('react-markdown') || id.includes('rehype') || id.includes('remark')) {
            return 'markdown-bundle'
          }
        },
      },
    },
  },
})
