import { r, redirect, rs } from 'shared'
import { createRouter, createWebHistory } from 'vue-router'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
  }
}

export const routes = [
  redirect('/article', '/article/a1'),
  r('/', '', [
    () => import('src/pages/home/mobile-home-page'),
    () => import('src/pages/home/home-page'),
  ]),
  r(
    '/article',
    '',
    [
      () => import('src/layouts/article-mobile-layout'),
      () => import('src/layouts/article-layout'),
    ],
    [
      rs('a1', '文章1', {
        main: () => import('src/pages/article/article1-page'),
      }),
      rs('a2', '文章2', {
        main: () => import('src/pages/article/article2-page'),
      }),
      rs('tsconfig', 'tsconfig', {
        main: () => import('src/pages/article/tsconfig/tsconfig-page'),
      }),
    ],
  ),
]

const router = createRouter({
  history: createWebHistory(
    qiankunWindow.__POWERED_BY_QIANKUN__ ? '/qiankun/viteApp/' : '',
  ),
  routes,
})

export default router
