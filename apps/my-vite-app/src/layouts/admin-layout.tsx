import { defineComponent, h, onMounted, ref, computed } from 'vue'
import {
  NLayout,
  NLayoutSider,
  NLayoutHeader,
  NLayoutContent,
  NMenu,
  NButton,
  NSpace,
  NTag,
  type MenuOption,
} from 'naive-ui'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuth } from 'src/composables/use-auth'
import { ADMIN_MENU_PERMISSIONS } from 'src/lib/permissions'

const allMenuOptions: MenuOption[] = [
  { label: () => h(RouterLink, { to: '/admin/dashboard' }, () => '仪表盘'), key: 'dashboard' },
  { label: () => h(RouterLink, { to: '/admin/users' }, () => '用户管理'), key: 'users' },
  { label: () => h(RouterLink, { to: '/admin/roles' }, () => '角色管理'), key: 'roles' },
  { label: () => h(RouterLink, { to: '/admin/analytics' }, () => 'PV/UV 统计'), key: 'analytics' },
  { label: () => h(RouterLink, { to: '/admin/page-config' }, () => '页面配置'), key: 'page-config' },
  { label: () => h(RouterLink, { to: '/admin/notifications' }, () => '通知中心'), key: 'notifications' },
]

export default defineComponent({
  name: 'AdminLayout',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { user, logout, can } = useAuth()
    const collapsed = ref(false)

    const menuOptions = computed(() =>
      allMenuOptions.filter(item => {
        const key = String(item.key)
        return can(ADMIN_MENU_PERMISSIONS[key] ?? null)
      }),
    )

    const activeKey = ref('dashboard')
    onMounted(() => {
      const seg = route.path.split('/')[2] ?? 'dashboard'
      activeKey.value = seg
    })

    const onLogout = () => {
      logout()
      void router.replace('/admin/login')
    }

    const roleLabel = computed(() => {
      if (user.value?.role === 'superadmin') return '超级管理员'
      if (user.value?.role === 'admin') return '管理员'
      return user.value?.role ?? ''
    })

    return () => (
      <NLayout has-sider style="min-height: 100vh">
        <NLayoutSider bordered collapse-mode="width" collapsed={collapsed.value} width={220}>
          <div style="padding: 16px; font-weight: 700; font-size: 16px">TongXK 后台</div>
          <NMenu value={activeKey.value} options={menuOptions.value} />
        </NLayoutSider>
        <NLayout>
          <NLayoutHeader
            bordered
            style="padding: 0 20px; height: 56px; display: flex; align-items: center; justify-content: space-between"
          >
            <span>后台管理系统</span>
            <NSpace align="center">
              <NTag type="success">{user.value?.username}</NTag>
              <NTag type={user.value?.role === 'superadmin' ? 'warning' : 'info'}>{roleLabel.value}</NTag>
              <NButton size="small" onClick={onLogout}>
                退出
              </NButton>
            </NSpace>
          </NLayoutHeader>
          <NLayoutContent style="padding: 20px">
            <RouterView />
          </NLayoutContent>
        </NLayout>
      </NLayout>
    )
  },
})
