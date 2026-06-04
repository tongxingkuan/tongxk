import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useSiteConfig } from 'src/context/SiteConfigContext'
import { enterGuest, logout } from 'src/store/auth'
import type { RootState } from 'src/store'

export default function AuthBar() {
  const dispatch = useDispatch()
  const { user, guest } = useSelector((s: RootState) => s.auth)
  const { t } = useSiteConfig()

  if (user) {
    return (
      <div className="auth-bar">
        <span className="auth-user">{t('nav.welcome', { name: user.username })}</span>
        <button type="button" className="btn-ghost" onClick={() => dispatch(logout())}>
          {t('nav.logout')}
        </button>
      </div>
    )
  }

  if (guest) {
    return (
      <div className="auth-bar">
        <span className="auth-guest">{t('nav.guestMode')}</span>
        <Link to="/login" className="nav-link">
          {t('nav.login')}
        </Link>
        <Link to="/register" className="btn btn-sm btn-primary">
          {t('nav.register')}
        </Link>
      </div>
    )
  }

  return (
    <div className="auth-bar">
      <Link to="/login" className="nav-link">
        {t('nav.login')}
      </Link>
      <Link to="/register" className="btn btn-sm btn-primary">
        {t('nav.register')}
      </Link>
      <button type="button" className="btn-ghost" onClick={() => dispatch(enterGuest())}>
        {t('nav.guest')}
      </button>
    </div>
  )
}
