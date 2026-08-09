import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { getToken } from './api/http'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: () => import('./views/Login.vue') },
  {
    path: '/',
    name: 'chat',
    component: () => import('./views/Chat.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/knowledge',
    name: 'knowledge',
    component: () => import('./views/Knowledge.vue'),
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(to => {
  if (to.meta.requiresAuth && !getToken()) return { name: 'login' }
  if (to.name === 'login' && getToken()) return { name: 'chat' }
})

export default router
