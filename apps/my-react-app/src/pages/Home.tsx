import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import HomeBanner from 'src/components/HomeBanner'
import GuestPrompt from 'src/components/GuestPrompt'
import NewsSection from 'src/components/NewsSection'
import WelcomePanel from 'src/components/WelcomePanel'
import { useSiteConfig } from 'src/context/SiteConfigContext'
import { trackPageView } from 'src/lib/analytics'

export default function Home() {
  const location = useLocation()
  const { t, ready } = useSiteConfig()

  useEffect(() => {
    if (!ready) return
    trackPageView(location.pathname, t('nav.home'))
  }, [location.pathname, t, ready])

  if (!ready) {
    return <div className="page-loading" />
  }

  return (
    <div className="page portal-home">
      <HomeBanner />
      <WelcomePanel />
      <GuestPrompt />
      <NewsSection />
    </div>
  )
}
