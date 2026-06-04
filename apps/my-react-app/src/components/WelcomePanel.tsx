import { Link } from 'react-router-dom'
import { useAuthAudience } from 'src/hooks/use-auth-audience'
import { useSiteConfig } from 'src/context/SiteConfigContext'

export default function WelcomePanel() {
  const { user, isMember } = useAuthAudience()
  const { t } = useSiteConfig()

  if (!isMember || !user) return null

  return (
    <section className="portal-welcome">
      <div className="portal-welcome-inner">
        <div className="portal-welcome-text">
          <h2>{t('home.welcome.title', { name: user.username })}</h2>
          <p>{t('home.welcome.subtitle')}</p>
        </div>
        <Link to="/list" className="btn btn-primary">
          {t('home.welcome.cta')}
        </Link>
      </div>
    </section>
  )
}
