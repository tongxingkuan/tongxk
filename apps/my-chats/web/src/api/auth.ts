import { http } from './http'
import type { AuthResult } from './types'

export function register(username: string, password: string) {
  return http.post<AuthResult>('/auth/register', { username, password }).then(r => r.data)
}

export function login(username: string, password: string) {
  return http.post<AuthResult>('/auth/login', { username, password }).then(r => r.data)
}

export function logout() {
  return http.post('/auth/logout').then(r => r.data)
}
