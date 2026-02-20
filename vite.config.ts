import { defineConfig } from "vite";
import legacy from "@vitejs/plugin-legacy";
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import path from 'path'

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@sandstone': path.resolve(__dirname, './sandstone'),
    },
  },
  plugins: [
    svelte(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/resources/*',
          dest: 'resources'
        }
      ]
    }),
    legacy({
      targets: ["chrome >= 79"],
      renderModernChunks: false,
      modernPolyfills: true,
    }),
  ],
});
