import { useEffect, useState } from 'react'
import { DEFAULT_LOGO_URL, resolveSiteBrand } from 'src/lib/brand-defaults'
import type { SiteBrandConfig } from 'src/types/site-config'

interface Props {
  brand: SiteBrandConfig
  alt: string
}

export default function SiteBrandLogo({ brand, alt }: Props) {
  const resolved = resolveSiteBrand(brand)
  const [src, setSrc] = useState(resolved.logoUrl ?? DEFAULT_LOGO_URL)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const next = resolveSiteBrand(brand)
    setSrc(next.logoUrl ?? DEFAULT_LOGO_URL)
    setFailed(false)
  }, [brand.logoUrl, brand.logoMark, brand.logoText])

  if (failed) {
    return (
      <span className="site-brand-mark" aria-hidden>
        {resolved.logoMark ?? 'T'}
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="site-brand-logo"
      onError={() => {
        if (src !== DEFAULT_LOGO_URL) {
          setSrc(DEFAULT_LOGO_URL)
          return
        }
        setFailed(true)
      }}
    />
  )
}
