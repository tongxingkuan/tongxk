import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { useAuthAudience } from 'src/hooks/use-auth-audience'
import { useSiteConfig } from 'src/context/SiteConfigContext'
import { enterGuest } from 'src/store/auth'

export default function GuestPrompt() {
  const dispatch = useDispatch()
  const { isVisitor, isGuest } = useAuthAudience()
  const { t } = useSiteConfig()

  if (!isVisitor) return null

  return (
    <section className="portal-guest-prompt">
      <div className="portal-guest-prompt-inner">
        <div className="portal-guest-prompt-text">
          <h2>{t('home.guest.title')}</h2>
          <p>{t('home.guest.subtitle')}</p>
        </div>
        <div className="portal-guest-prompt-actions">
          <Link to="/login" className="btn btn-secondary">
            {t('home.guest.login')}
          </Link>
          <Link to="/register" className="btn btn-primary">
            {t('home.guest.register')}
          </Link>
          {!isGuest && (
            <button type="button" className="btn btn-ghost" onClick={() => dispatch(enterGuest())}>
              {t('home.guest.browse')}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
