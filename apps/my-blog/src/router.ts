import { r, rs } from 'shared'
import { createRouter, createWebHistory } from 'vue-router'
import MainLayout from './layouts/mobile-layout'
import ArticleLayout from './layouts/article-layout'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
  }
}

export const routes = [
  r('/', '', MainLayout, [
    r('home', '首页', () => import('src/pages/home/home')),
  ]),
  r('/', '', ArticleLayout, [
    rs('article', '文章', {
      top: () => import('src/pages/article/top'),
      main: () => import('src/pages/article/article1'),
    }),
  ]),
]
const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
