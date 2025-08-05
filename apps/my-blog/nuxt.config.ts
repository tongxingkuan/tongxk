import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'src/',
  modules: ['@nuxt/content'],
  content: {
    markdown: {
      toc: {
        depth: 5,
        searchDepth: 5,
      },
      anchorLinks: {
        depth: 6,
        exclude: [1],
      },
    },
    highlight: {
      preload: ['javascript', 'typescript', 'html', 'css', 'less', 'json', 'cmd', 'jsx', 'tsx', '文言'],
    },
  },
  css: [
    '~/assets/style/theme.less',
    '~/assets/style/animate.less',
    '~/assets/style/tailwind.css',
    '~/assets/style/normalize.less',
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  devServer: {
    // 允许跨域
    cors: {
      origin: '*',
    },
  },

  compatibilityDate: '2025-02-08',
})
