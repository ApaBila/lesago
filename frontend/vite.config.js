import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        learning: resolve(__dirname, 'learning.html'),
        ols: resolve(__dirname, 'modules/ols/index.html'),
        mlp: resolve(__dirname, 'modules/mlp/index.html'),
        attention: resolve(__dirname, 'modules/attention/index.html'),
      },
    },
  },
})