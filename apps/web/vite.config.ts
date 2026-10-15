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
          const match = id.replace(/\\/g, '/').match(/.*\/node_modules\/(?:@([^/]+)\/)?([^/]+)/)
          if (!match) return

          const packageName = match[1] ? `@${match[1]}/${match[2]}` : match[2]

          if (packageName === 'react' || packageName === 'react-dom') {
            return 'react-core'
          }
        },
      },
    },
  },
})
