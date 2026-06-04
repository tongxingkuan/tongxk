import { Link } from 'react-router-dom'
import AuthBar from 'src/components/AuthBar'
import LocaleSwitcher from 'src/components/LocaleSwitcher'
import NotificationBell from 'src/components/NotificationBell'
import SiteBrandLogo from 'src/components/SiteBrandLogo'
import ThemeSwitcher from 'src/components/ThemeSwitcher'
import { useAuthAudience } from 'src/hooks/use-auth-audience'
import { resolveSiteBrand } from 'src/lib/brand-defaults'
import { useSiteConfig } from 'src/context/SiteConfigContext'

export default function SiteHeader() {
  const { t, siteBrand } = useSiteConfig()
  const { isMember } = useAuthAudience()
  const brand = resolveSiteBrand(siteBrand)
  const title = t('site.title') || brand.logoText || 'TongXK'

  return (
    <header className={`site-header portal-header ${isMember ? 'is-member' : 'is-visitor'}`}>
      <div className="site-header-inner">
        <Link to="/" className="site-brand">
          <SiteBrandLogo brand={brand} alt={title} />
          <span className="site-brand-text">
            <span className="site-title">{title}</span>
            {brand.tagline && <span className="site-tagline">{brand.tagline}</span>}
          </span>
        </Link>
        <nav className="site-nav">
          <Link to="/" className="nav-link">
            {t('nav.home')}
          </Link>
          <Link to="/list" className="nav-link">
            {t('nav.list')}
          </Link>
          <ThemeSwitcher />
          <LocaleSwitcher />
          {isMember && <NotificationBell />}
          <AuthBar />
        </nav>
      </div>
    </header>
  )
}
