import { useSelector } from 'react-redux'
import type { RootState } from 'src/store'

/** 已登录会员 */
export function useAuthAudience() {
  const { user, guest } = useSelector((s: RootState) => s.auth)
  const isMember = !!user
  const isGuest = guest && !user
  const isVisitor = !user
  return { user, isMember, isGuest, isVisitor }
}
