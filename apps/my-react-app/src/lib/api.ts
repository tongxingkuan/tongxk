declare const process: { env: { API_BASE_URL?: string } }

export const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3100'

export interface ApiUser {
  id: string
  username: string
  role: string
  createdAt: string
}

const TOKEN_KEY = 'front_token'
const GUEST_KEY = 'front_guest_mode'

export const getToken = () => localStorage.getItem(TOKEN_KEY) ?? ''
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export const isGuestMode = () => localStorage.getItem(GUEST_KEY) === '1'
export const setGuestMode = (v: boolean) => {
  if (v) localStorage.setItem(GUEST_KEY, '1')
  else localStorage.removeItem(GUEST_KEY)
}

import type { PublicPageConfigResponse } from 'src/types/site-config'

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { message?: string }).message ?? `请求失败 (${res.status})`)
  }
  return data as T
}

export const api = {
  register: (username: string, password: string) =>
    request<{ user: ApiUser, token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  login: (username: string, password: string) =>
    request<{ user: ApiUser, token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<ApiUser>('/auth/me'),
  pageConfig: (options?: { group?: string, locale?: string }) => {
    const params = new URLSearchParams()
    if (options?.group) params.set('group', options.group)
    if (options?.locale) params.set('locale', options.locale)
    const qs = params.toString()
    return request<PublicPageConfigResponse>(`/page-config/public${qs ? `?${qs}` : ''}`)
  },
  track: (body: Record<string, unknown>) => request('/analytics/track', { method: 'POST', body: JSON.stringify(body) }),
  notifications: {
    feed: (visitorId: string) =>
      request<
        {
          id: string
          title: string
          content: string
          type: string
          read: boolean
          link: string | null
        }[]
      >(`/notifications/feed?visitorId=${encodeURIComponent(visitorId)}`),
    markRead: (notificationIds: string[], visitorId: string) =>
      request('/notifications/read', {
        method: 'POST',
        body: JSON.stringify({ notificationIds, visitorId }),
      }),
  },
}
