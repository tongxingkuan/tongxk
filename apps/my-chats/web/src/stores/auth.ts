import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as authApi from '../api/auth'
import { clearToken, getToken, setToken } from '../api/http'
import type { PublicUser } from '../api/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<PublicUser | null>(null)
  const token = ref<string | null>(getToken())

  async function register(username: string, password: string) {
    const res = await authApi.register(username, password)
    token.value = res.token
    user.value = res.user
    setToken(res.token)
  }

  async function login(username: string, password: string) {
    const res = await authApi.login(username, password)
    token.value = res.token
    user.value = res.user
    setToken(res.token)
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // 忽略登出请求失败
    }
    token.value = null
    user.value = null
    clearToken()
  }

  return { user, token, register, login, logout }
})
