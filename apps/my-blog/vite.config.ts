import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import tailwindcss from '@tailwindcss/vite'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { plugin as mdPlugin, Mode } from 'vite-plugin-markdown'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectDir = __dirname
const isCustomElement = (tag: string) => tag.startsWith('x-')
const project = (path: string) => join(projectDir, path)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx({
      isCustomElement,
      defineComponentName: ['defineComponent', 'createComponent'],
    }),
    tailwindcss(),
    mdPlugin({ mode: [Mode.HTML, Mode.VUE] }),
  ],
  resolve: {
    alias: {
      src: project('src'),
    },
  },
})
