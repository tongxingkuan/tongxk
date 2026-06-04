import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthAudience } from 'src/hooks/use-auth-audience'
import { pickBanner } from 'src/lib/audience-config'
import { useSiteConfig } from 'src/context/SiteConfigContext'

export default function HomeBanner() {
  const { homeBanner } = useSiteConfig()
  const { isMember } = useAuthAudience()
  const banner = useMemo(() => pickBanner(homeBanner, isMember), [homeBanner, isMember])
  const slides = banner.slides ?? []
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [isMember, slides.length])

  useEffect(() => {
    if (slides.length <= 1) return
    const ms = banner.autoplayMs ?? 5000
    const timer = window.setInterval(() => {
      setIndex(i => (i + 1) % slides.length)
    }, ms)
    return () => window.clearInterval(timer)
  }, [slides.length, banner.autoplayMs])

  if (slides.length === 0) return null

  const slide = slides[index] ?? slides[0]
  const showCta = slide.ctaText && slide.ctaLink

  return (
    <section className={`portal-banner ${isMember ? 'portal-banner-member' : 'portal-banner-guest'}`}>
      {slides.map((s, i) => (
        <div
          key={`${s.image}-${i}`}
          className={`portal-banner-bg ${i === index ? 'active' : ''}`}
          style={{ backgroundImage: `url(${s.image})` }}
          aria-hidden={i !== index}
        />
      ))}
      <div className="portal-banner-overlay" />
      <div className="portal-banner-content">
        <h1 className="portal-banner-title">{slide.title}</h1>
        {slide.subtitle && <p className="portal-banner-subtitle">{slide.subtitle}</p>}
        {showCta && (
          <Link className="btn btn-primary btn-lg" to={slide.ctaLink}>
            {slide.ctaText}
          </Link>
        )}
      </div>
      {slides.length > 1 && (
        <div className="portal-banner-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`portal-banner-dot ${i === index ? 'active' : ''}`}
              aria-label={`Slide ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
