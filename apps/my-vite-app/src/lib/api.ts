export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100'

export interface ApiUser {
  id: string
  username: string
  role: string
  createdAt: string
  permissions?: string[]
}

const TOKEN_KEY = 'admin_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY) ?? ''
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

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
  login: (username: string, password: string) =>
    request<{ user: ApiUser, token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<ApiUser>('/auth/me'),
  users: {
    list: () => request<Record<string, unknown>[]>('/users'),
    update: (id: string, body: Record<string, unknown>) =>
      request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
    resetPassword: (id: string, password: string) =>
      request(`/users/${id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      }),
  },
  roles: {
    list: () => request<Record<string, unknown>[]>('/roles'),
    create: (body: Record<string, unknown>) => request('/roles', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      request(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id: string) => request(`/roles/${id}`, { method: 'DELETE' }),
  },
  analytics: {
    overview: (days = 7) => request<Record<string, unknown>>(`/analytics/overview?days=${days}`),
  },
  pageConfig: {
    list: () => request<Record<string, unknown>[]>('/page-config'),
    create: (body: Record<string, unknown>) => request('/page-config', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, unknown>) =>
      request(`/page-config/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    remove: (id: string) => request(`/page-config/${id}`, { method: 'DELETE' }),
  },
  notifications: {
    list: () => request<Record<string, unknown>[]>('/notifications'),
    create: (body: Record<string, unknown>) =>
      request('/notifications', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Record<string, unknown>) =>
      request(`/notifications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    remove: (id: string) => request(`/notifications/${id}`, { method: 'DELETE' }),
  },
  metrics: () => request<Record<string, unknown>>('/metrics'),
}
