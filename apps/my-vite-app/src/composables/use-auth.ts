import { ref, computed } from 'vue'
import { api, clearToken, getToken, setToken, type ApiUser } from 'src/lib/api'
import { hasPermission, isSuperAdmin } from 'src/lib/permissions'

export const authUser = ref<ApiUser | null>(null)
const loading = ref(false)

export function useAuth() {
  const isLoggedIn = computed(() => !!authUser.value && !!getToken())
  const isAdmin = computed(() => authUser.value?.role === 'superadmin' || authUser.value?.role === 'admin')
  const isSuperAdminRole = computed(() => isSuperAdmin(authUser.value?.role))
  const permissions = computed(() => authUser.value?.permissions ?? [])

  function can(perm: string | null) {
    return hasPermission(permissions.value, perm)
  }

  async function login(username: string, password: string) {
    loading.value = true
    try {
      const res = await api.login(username, password)
      if (res.user.role !== 'superadmin' && res.user.role !== 'admin') {
        throw new Error('仅管理员可登录后台')
      }
      setToken(res.token)
      authUser.value = res.user
      return res.user
    } finally {
      loading.value = false
    }
  }

  async function restore() {
    if (!getToken()) return null
    loading.value = true
    try {
      const me = await api.me()
      if (me.role !== 'superadmin' && me.role !== 'admin') {
        clearToken()
        authUser.value = null
        return null
      }
      authUser.value = me
      return me
    } catch {
      clearToken()
      authUser.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearToken()
    authUser.value = null
  }

  return {
    user: authUser,
    loading,
    isLoggedIn,
    isAdmin,
    isSuperAdmin: isSuperAdminRole,
    permissions,
    can,
    login,
    restore,
    logout,
  }
}
