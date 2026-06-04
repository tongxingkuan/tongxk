/** 后台菜单与权限点映射 */
export const ADMIN_MENU_PERMISSIONS: Record<string, string | null> = {
  dashboard: null,
  users: 'users:read',
  roles: 'roles:read',
  analytics: 'analytics:read',
  'page-config': 'page-config:read',
  notifications: 'notifications:read',
}

export function hasPermission(permissions: string[] | undefined, required: string | null): boolean {
  if (!required) return true
  if (!permissions?.length) return false
  if (permissions.includes('*')) return true
  return permissions.includes(required)
}

export function isSuperAdmin(role?: string): boolean {
  return role === 'superadmin'
}
