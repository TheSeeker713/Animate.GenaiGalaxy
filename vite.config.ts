import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Rolldown rejects @mediapipe/tasks-vision's malformed "exports" field; bundle the ESM entry directly.
      '@mediapipe/tasks-vision': path.resolve(
        __dirname,
        'node_modules/@mediapipe/tasks-vision/vision_bundle.mjs'
      ),
    },
  },
  build: {
    // Raised while Rolldown + lazy routes settle; lower after chunk review.
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { test: /node_modules[\\/]pixi\.js/, name: 'pixi' },
            { test: /node_modules[\\/]reactflow/, name: 'reactflow' },
          ],
        },
      },
    },
  },
})
