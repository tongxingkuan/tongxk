import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'

const isWindows = process.platform === 'win32'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Windows 上忽略无权限目录的 watch 失败，避免 unhandledRejection 导致 dev 中断
  watchers: {
    chokidar: {
      ignorePermissionErrors: true,
    },
  },
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
    server: {
      watch: {
        ignorePermissionErrors: true,
        // 不监听 monorepo 其他 app 与 IDE 元数据，减少 Windows 下 EPERM
        ignored: [
          '**/.git/**',
          '**/.cursor/**',
          '**/.pnpm/**',
          '**/node_modules/**',
          '**/agent-transcripts/**',
          resolve(__dirname, '../../apps/my-nestjs/**'),
          resolve(__dirname, '../../apps/my-react-app/**'),
          resolve(__dirname, '../../apps/my-vue2-app/**'),
          resolve(__dirname, '../../apps/my-vite-app/**'),
        ],
        ...(isWindows ? { usePolling: true, interval: 1000 } : {}),
      },
    },
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
  },

  compatibilityDate: '2025-02-08',
})
