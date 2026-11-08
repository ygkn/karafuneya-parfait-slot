import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// relative base so the build works under https://<user>.github.io/<repo>/
export default defineConfig({
  base: './',
  plugins: [svelte()],
})
