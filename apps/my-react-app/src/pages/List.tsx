import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthAudience } from 'src/hooks/use-auth-audience'
import { pickNews } from 'src/lib/audience-config'
import { useSiteConfig } from 'src/context/SiteConfigContext'
import { trackPageView } from 'src/lib/analytics'

export default function List() {
  const location = useLocation()
  const { t, homeNews, ready } = useSiteConfig()
  const { isMember } = useAuthAudience()
  const news = useMemo(() => pickNews(homeNews, isMember), [homeNews, isMember])

  useEffect(() => {
    if (!ready) return
    trackPageView(location.pathname, t('nav.list'))
  }, [location.pathname, t, ready])

  if (!ready) {
    return <div className="page-loading" />
  }

  const items = news.items ?? []

  return (
    <div className="page portal-list">
      <div className="portal-list-header">
        <h1>{news.title ?? t('nav.list')}</h1>
        <p className="portal-list-desc">{isMember ? t('home.list.memberDesc') : t('home.list.guestDesc')}</p>
      </div>
      <div className="news-list-full">
        {items.map(item => (
          <article key={item.id} className="news-list-item">
            <Link to={item.link ?? '#'} className="news-list-thumb">
              <img src={item.image} alt={item.title} loading="lazy" />
            </Link>
            <div className="news-list-body">
              <div className="news-list-meta">
                <time>{item.date}</time>
                {item.category && <span className="news-list-tag">{item.category}</span>}
              </div>
              <h2>
                <Link to={item.link ?? '#'}>{item.title}</Link>
              </h2>
              <p>{item.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
