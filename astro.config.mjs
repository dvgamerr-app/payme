import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import svelte from '@astrojs/svelte'
import tailwindcss from '@tailwindcss/vite'
import bun from '@nurodev/astro-bun'

export default defineConfig({
  adapter: bun(),
  integrations: [svelte()],
  output: 'server',
  build: {
    assets: 'dist',
  },
  server: {
    host: false,
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssMinify: 'esbuild',
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      watch: {
        ignored: ['.github/**/*', '.vscode/**/*', 'drizzle/**/*'],
      },
    },
  },
  security: {
    checkOrigin: false,
  },
})
