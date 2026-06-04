import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
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
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/articles', '/questions', '/demos'],
    },
  },
  hooks: {
    // 在 prerender:routes 钩子里，按 src/content 目录结构枚举所有文档路径
    // 注入到 prerender 队列。这样不依赖列表页 SSR 渲染列表，也不会踩 @nuxt/content
    // 内部 storage 的 key 命名变化。
    'nitro:init'(nitro) {
      nitro.hooks.hook('prerender:routes', async routes => {
        const root = resolve(__dirname, 'src/content')
        for (const dir of ['articles', 'questions', 'demos']) {
          let entries: string[]
          try {
            entries = await readdir(resolve(root, dir))
          } catch {
            continue
          }
          for (const f of entries) {
            if (!f.endsWith('.md') || f.startsWith('_')) continue
            routes.add(`/${dir}/${f.replace(/\.md$/, '')}`)
          }
        }
      })
    },
  },
  devServer: {
    // 允许跨域
    cors: {
      origin: '*',
    },
  },

  runtimeConfig: {
    public: {
      // 生产环境绝对链接前缀，可通过 NUXT_PUBLIC_SITE_URL 覆盖
      siteUrl: 'https://tongxingkuan.xin',
    },
    // 仅服务端可读；可通过环境变量 NUXT_OLLAMA_BASE_URL / NUXT_OLLAMA_MODEL / NUXT_OLLAMA_API_KEY 覆盖
    ollamaBaseUrl: 'https://tongxingkuan.xin:2083',
    ollamaModel: 'glm-5.1:cloud',
    ollamaApiKey: 'c80054aa68e34294b54bdc47418d970c.Txirw2k2G8r_IOFf9xbAYWWH',
  },

  compatibilityDate: '2025-02-08',
})
