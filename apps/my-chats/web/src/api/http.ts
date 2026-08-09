import axios from 'axios'

export const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

const TOKEN_KEY = 'my-chats-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** 统一 fetch 入口：401 清 token 并跳登录（与 axios 拦截器一致） */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init)
  if (res.status === 401) {
    clearToken()
    if (location.pathname !== '/login') location.href = '/login'
  }
  return res
}

http.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      clearToken()
      if (location.pathname !== '/login') location.href = '/login'
    }
    return Promise.reject(err as Error)
  },
)
