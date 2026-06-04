import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuthAudience } from 'src/hooks/use-auth-audience'
import { pickNews } from 'src/lib/audience-config'
import { useSiteConfig } from 'src/context/SiteConfigContext'

export default function NewsSection() {
  const { homeNews } = useSiteConfig()
  const { isMember } = useAuthAudience()
  const news = useMemo(() => pickNews(homeNews, isMember), [homeNews, isMember])
  const items = news.items ?? []

  if (items.length === 0) return null

  return (
    <section className={`portal-news ${isMember ? 'portal-news-member' : 'portal-news-guest'}`}>
      <div className="section-head portal-section-head">
        <h2>{news.title}</h2>
        {news.moreLink && (
          <Link to={news.moreLink} className="section-more">
            {news.moreText} →
          </Link>
        )}
      </div>
      <div className="news-grid">
        {items.map(item => (
          <article key={item.id} className="news-card">
            <Link to={item.link ?? '/list'} className="news-card-image-wrap">
              <img src={item.image} alt={item.title} className="news-card-image" loading="lazy" />
              {item.category && <span className="news-card-category">{item.category}</span>}
            </Link>
            <div className="news-card-body">
              <time className="news-card-date">{item.date}</time>
              <h3 className="news-card-title">
                <Link to={item.link ?? '/list'}>{item.title}</Link>
              </h3>
              <p className="news-card-summary">{item.summary}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
