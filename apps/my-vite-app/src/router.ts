import { createRouter, createWebHashHistory, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { qiankunWindow } from 'vite-plugin-qiankun/dist/helper'
import { getToken } from 'src/lib/api'
import { authUser } from 'src/composables/use-auth'
import { ADMIN_MENU_PERMISSIONS, hasPermission } from 'src/lib/permissions'
import { isQiankunEnv } from 'src/lib/qiankun-base'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    public?: boolean
    permission?: string | null
  }
}

/** qiankun 内用 hash，避免子路由 push 触发主应用 Nuxt 换页 */
const history = isQiankunEnv() || qiankunWindow.__POWERED_BY_QIANKUN__ ? createWebHashHistory() : createWebHistory('/')

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/admin/dashboard' },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: () => import('src/pages/admin/login-page'),
    meta: { public: true, title: '登录' },
  },
  {
    path: '/admin',
    component: () => import('src/layouts/admin-layout'),
    children: [
      { path: '', redirect: '/admin/dashboard' },
      {
        path: 'dashboard',
        name: 'admin-dashboard',
        component: () => import('src/pages/admin/dashboard-page'),
        meta: { title: '仪表盘', permission: null },
      },
      {
        path: 'users',
        name: 'admin-users',
        component: () => import('src/pages/admin/users-page'),
        meta: { title: '用户管理', permission: 'users:read' },
      },
      {
        path: 'roles',
        name: 'admin-roles',
        component: () => import('src/pages/admin/roles-page'),
        meta: { title: '角色管理', permission: 'roles:read' },
      },
      {
        path: 'analytics',
        name: 'admin-analytics',
        component: () => import('src/pages/admin/analytics-page'),
        meta: { title: 'PV/UV 统计', permission: 'analytics:read' },
      },
      {
        path: 'page-config',
        name: 'admin-page-config',
        component: () => import('src/pages/admin/page-config-page'),
        meta: { title: '页面配置', permission: 'page-config:read' },
      },
      {
        path: 'notifications',
        name: 'admin-notifications',
        component: () => import('src/pages/admin/notifications-page'),
        meta: { title: '通知中心', permission: 'notifications:read' },
      },
    ],
  },
]

const router = createRouter({
  history,
  routes,
})

router.beforeEach((to, _from, next) => {
  if (to.meta.public) return next()
  if (to.path.startsWith('/admin') && to.path !== '/admin/login' && !getToken()) {
    return next('/admin/login')
  }

  const perm = to.meta.permission
  if (perm !== undefined && authUser.value) {
    const perms = authUser.value.permissions ?? []
    if (!hasPermission(perms, perm ?? null)) {
      return next('/admin/dashboard')
    }
  }

  // 兜底：按 path 段校验菜单权限
  const seg = to.path.split('/')[2]
  if (seg && authUser.value && seg in ADMIN_MENU_PERMISSIONS) {
    const required = ADMIN_MENU_PERMISSIONS[seg]
    if (!hasPermission(authUser.value.permissions, required)) {
      return next('/admin/dashboard')
    }
  }

  next()
})

export default router
